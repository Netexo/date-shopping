import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createOrderFileStore } from "../app/lib/order-file.js";

const order=(patch={})=>({idempotencyKey:randomUUID(),date:"2026-10-27",time:"18:30",entries:[{id:"pickup-service"},{id:"restaurant",variantId:"greek"}],...patch});
async function withStore(run){
  const directory=await mkdtemp(join(tmpdir(),"date-shopping-file-test-"));
  const file=join(directory,"data","orders.json");
  try{await run(createOrderFileStore(file),file,directory);}finally{await rm(directory,{recursive:true,force:true});}
}

test("missing directory and orders.json are automatically created with private permissions",()=>withStore(async(store,file)=>{
  assert.deepEqual(await store.list(),{orders:[],hasMore:false,page:0});
  assert.deepEqual(JSON.parse(await readFile(file,"utf8")),[]);
  if(process.platform!=="win32")assert.equal((await stat(file)).mode & 0o777,0o600);
}));

test("completed orders, restaurant choice, catalog prices and timestamp survive a new store instance",()=>withStore(async(store,file)=>{
  const input=order();const receipt=await store.create(input);
  assert.equal(receipt.spent,50);assert.equal(receipt.remaining,50);assert.equal(receipt.status,"completed");
  assert.ok(Number.isFinite(Date.parse(receipt.created_at)));
  const saved=JSON.parse(await readFile(file,"utf8"));
  assert.equal(saved[0].items[0].name,"Abholservice");assert.equal(saved[0].items[0].credits,15);
  assert.equal(saved[0].items[1].name,"Restaurant – Grieche");
  const restored=await createOrderFileStore(file).list();assert.equal(restored.orders[0].id,receipt.id);
  assert.ok(!Object.hasOwn(restored.orders[0],"idempotencyKey"));assert.ok(!Object.hasOwn(restored.orders[0],"requestHash"));
}));

test("simultaneous retries and reordered products produce exactly one saved order",()=>withStore(async(store,file)=>{
  const input=order();
  const results=await Promise.all(Array.from({length:20},(_,i)=>createOrderFileStore(file).create({...input,entries:i%2?[...input.entries].reverse():input.entries})));
  assert.equal(new Set(results.map(result=>result.id)).size,1);
  assert.equal(JSON.parse(await readFile(file,"utf8")).length,1);
  assert.equal((await store.create({...input,idempotencyKey:input.idempotencyKey.toUpperCase()})).id,results[0].id);
}));

test("simultaneous different orders are preserved, newest first, with pagination",()=>withStore(async(store,file)=>{
  await Promise.all(Array.from({length:28},(_,i)=>store.create(order({time:`18:${String(i).padStart(2,"0")}`}))));
  const first=await store.list();const second=await store.list(1);
  assert.equal(first.orders.length,25);assert.equal(first.hasMore,true);assert.equal(second.orders.length,3);assert.equal(second.hasMore,false);
  const saved=JSON.parse(await readFile(file,"utf8"));assert.equal(saved.length,28);
  assert.ok(first.orders[0].created_at>=second.orders.at(-1).created_at);
}));

test("changed payload under the same retry key is rejected without modifying orders",()=>withStore(async(store,file)=>{
  const input=order();await store.create(input);const original=await readFile(file,"utf8");
  await assert.rejects(store.create({...input,time:"19:00"}),error=>error.status===409);
  assert.equal(await readFile(file,"utf8"),original);
}));

test("invalid product prices or more than 100 credits are rejected before touching the file",()=>withStore(async(store,file,directory)=>{
  await assert.rejects(store.create(order({entries:[{id:"pickup-service",credits:0}]})));
  await assert.rejects(store.create(order({entries:[{id:"gym"}]})));
  await assert.rejects(store.create(order({entries:[{id:"badminton"},{id:"arcade"},{id:"bowling"},{id:"bar"},{id:"walk"}]})));
  assert.deepEqual(await readdir(directory),[]);
}));

test("corrupt JSON or invalid snapshots are never overwritten",()=>withStore(async(store,file)=>{
  await store.list();await writeFile(file,"{broken");
  await assert.rejects(store.create(order()),/beschädigt/);
  assert.equal(await readFile(file,"utf8"),"{broken");
  await writeFile(file,JSON.stringify([{id:"incomplete"}]));
  await assert.rejects(store.list(),/beschädigt/);
}));

test("write failures report an error; the queue recovers when the filesystem is repaired",()=>withStore(async(_,file,directory)=>{
  const parent=join(directory,"not-a-directory");await writeFile(parent,"keep");
  const store=createOrderFileStore(join(parent,"orders.json"));
  await assert.rejects(store.create(order()));
  assert.equal(await readFile(parent,"utf8"),"keep");
  await rm(parent);await store.create(order());
  assert.equal((await store.list()).orders.length,1);
}));
