import assert from 'node:assert/strict';
import {test} from 'node:test';
import {actionRequiredFindings} from '../scripts/notion-preview-gate.mjs';

test('advisory flexible differences do not require action',()=>{
  const report={itinerary:{reviews:[
    {message:'Start Time: Notion=13:25, GitHub=11:30'},
    {message:'Status: Notion=planned, GitHub=pending'}
  ]},reservations:{reviews:[]}};
  assert.equal(actionRequiredFindings(report).length,0);
});

test('protected itinerary blockers require action',()=>{
  const report={itinerary:{reviews:[{message:'BLOCK: Notion planned would downgrade GitHub confirmed.'}]},reservations:{reviews:[]}};
  assert.equal(actionRequiredFindings(report).length,1);
});

test('new locked rows without deterministic mappings require action',()=>{
  const report={itinerary:{reviews:[{message:'Locked row needs explicit mapping before publish.'}]},reservations:{reviews:[]}};
  assert.equal(actionRequiredFindings(report).length,1);
});

test('confirmed reservation mapping/status reviews require action',()=>{
  const report={itinerary:{reviews:[]},reservations:{reviews:[
    {message:'Confirmed reservation needs an explicit ticket mapping before publish.'},
    {message:'Status: Notion=confirmed, GitHub=pending'}
  ]}};
  assert.equal(actionRequiredFindings(report).length,2);
});
