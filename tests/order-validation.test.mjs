import test from "node:test";
import assert from "node:assert/strict";
import { validateOrder } from "../app/lib/order-validation.js";
const key="2d2087ae-5bfd-4abc-8431-51ea7e8bb0be";
const input=(entries)=>({idempotencyKey:key,date:"2026-10-27",time:"18:30",entries});

test("server computes prices, product names, restaurant selection and remaining credits",()=>{
  const order=validateOrder(input([{id:"badminton"},{id:"restaurant",variantId:"greek"}]));
  assert.equal(order.spent,60);assert.equal(order.remaining,40);
  assert.equal(order.items[1].name,"Restaurant – Grieche");
});

test("server rejects forged prices, duplicate products, removed products and invalid restaurant variants",()=>{
  for(const entries of [[],[{id:"badminton",credits:0}],[{id:"bar"},{id:"bar"}],[{id:"gym"}],[{id:"restaurant"}],[{id:"restaurant",variantId:"unknown"}],[{id:"dinner-date"}],[{id:"__proto__"}],[{id:{toString:null}}],[{id:"bar",variantId:"asian"}]]) assert.throws(()=>validateOrder(input(entries)));
  assert.throws(()=>validateOrder({...input([{id:"walk"}]),spent:0}));
});

test("server accepts exactly 100 credits and rejects any over-budget selection instead of silently dropping products",()=>{
  const entries=[{id:"badminton"},{id:"arcade"},{id:"bowling"},{id:"bar"}];
  assert.equal(validateOrder(input(entries)).remaining,0);
  assert.throws(()=>validateOrder(input([...entries,{id:"walk"}])));
});

test("server rejects invalid dates, times, malformed bodies and non-UUID retry keys",()=>{
  for(const patch of [{date:"2026-02-30"},{date:"0000-01-01"},{time:"24:00"},{time:"8:00"},{idempotencyKey:"known-order"},{entries:null}]) assert.throws(()=>validateOrder({...input([{id:"walk"}]),...patch}));
  for(const body of [null,[],"invalid"])assert.throws(()=>validateOrder(body));
});

test("server accepts Abholservice at 15 credits and rejects removed Gym",()=>{
  const order=validateOrder(input([{id:"pickup-service"}]));
  assert.deepEqual(order.items,[{id:"pickup-service",name:"Abholservice",credits:15}]);
  assert.equal(order.remaining,85);
  assert.throws(()=>validateOrder(input([{id:"gym"}])));
});
