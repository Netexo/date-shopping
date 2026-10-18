import test from "node:test";
import assert from "node:assert/strict";
import { createAdminSession, verifyAdminSession, passwordMatches, SESSION_SECONDS } from "../app/lib/admin-session.js";
const password="fixture-only-strong-password";
const now=Date.UTC(2026,9,18,12);

test("admin password is compared exactly and missing/short configurations fail closed",()=>{
  assert.equal(passwordMatches(password,password),true);
  for(const value of ["wrong",password+" ",null,{},"x".repeat(1025)])assert.equal(passwordMatches(value,password),false);
  assert.equal(passwordMatches("short","short"),false);
  assert.throws(()=>createAdminSession(""));
});

test("signed session expires and is invalidated by changing the admin password",()=>{
  const session=createAdminSession(password,now);
  assert.equal(verifyAdminSession(session,password,now),true);
  assert.equal(verifyAdminSession(session,password,now+(SESSION_SECONDS-1)*1000),true);
  assert.equal(verifyAdminSession(session,password,now+SESSION_SECONDS*1000),false);
  assert.equal(verifyAdminSession(session,"another-strong-password",now),false);
});

test("tampered, unsigned, malformed and non-ASCII sessions never authenticate or throw",()=>{
  const session=createAdminSession(password,now);const [payload,signature]=session.split(".");
  for(const value of [null,"",`${payload}.wrong`,`${payload}.${"ü".repeat(signature.length)}`,`${payload}x.${signature}`,`${session}.extra`,"x".repeat(1025)])assert.equal(verifyAdminSession(value,password,now),false);
  assert.notEqual(createAdminSession(password,now),session);
});
