import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, aggregate, byPerson, cafeText, saveState, loadState, addChoice, clearOrders } from '../core.js';
const orders = [
 {id:'1',name:'민수',coffee:'아메리카노',temperature:'ICE',size:'기본'},
 {id:'2',name:'지영',coffee:'아메리카노',temperature:'ICE',size:'기본'},
 {id:'3',name:'민수',coffee:'아메리카노',temperature:'HOT',size:'기본'},
 {id:'4',name:'민수',coffee:'아메리카노',temperature:'ICE',size:'크게'}
];
test('groups by all options and preserves total',()=>{const a=aggregate(orders);assert.equal(a.length,3);assert.equal(a[0].count,2);assert.equal(a.reduce((n,x)=>n+x.count,0),4);});
test('personal list retains multiple drinks per name',()=>{const p=byPerson(orders);assert.equal(p.length,2);assert.equal(p[0].orders.length,3);});
test('cafe copy excludes personal names',()=>{const s=cafeText(orders);assert.ok(s.includes('총 4잔'));assert.ok(s.includes('ICE / 기본 — 2잔'));assert.ok(!s.includes('민수'));assert.ok(!s.includes('지영'));});
test('completed and draft orders survive storage round trip',()=>{let value;const storage={setItem(k,v){value=v},getItem(){return value}};for(const completed of [false,true]){const state={...initialState(),orders,completed,completedAt:completed?'2026-10-05T00:00:00.000Z':null};assert.equal(saveState(storage,state),true);assert.deepEqual(loadState(storage).state,state);}});
test('storage failures are surfaced',()=>{const storage={setItem(){throw Error('quota')},getItem(){throw Error('blocked')}};assert.equal(saveState(storage,initialState()),false);assert.ok(loadState(storage).error);});
test('invalid stored data does not silently replace orders',()=>{assert.ok(loadState({getItem(){return '{broken'}}).error);assert.ok(loadState({getItem(){return JSON.stringify({orders:[{}]})}}).error);});
test('draft restoration normalizes damaged completion timestamp',()=>{const s={...initialState(),orders,completedAt:'invalid-date'};const restored=loadState({getItem(){return JSON.stringify(s)}});assert.equal(restored.error,false);assert.equal(restored.state.completedAt,null);assert.deepEqual(restored.state.orders,orders);});
test('custom choices trim whitespace and reject duplicates or blanks',()=>{assert.deepEqual(addChoice(['기본'],' 크게 '),['기본','크게']);assert.throws(()=>addChoice(['기본'],' 기본 '));assert.throws(()=>addChoice([], '  '));});
test('clearing orders retains menu settings and reset restores defaults',()=>{const state={...initialState(),orders,completed:true,coffees:['직접추가']};const cleared=clearOrders(state);assert.deepEqual(cleared.orders,[]);assert.deepEqual(cleared.coffees,['직접추가']);assert.equal(cleared.completed,false);assert.ok(initialState().coffees.includes('아메리카노'));});
