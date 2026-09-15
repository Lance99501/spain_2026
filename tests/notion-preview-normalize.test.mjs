import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isEquivalentStatusReview,lifecycleStatus,normalizePreviewReport} from '../scripts/notion-preview-normalize.mjs';

test('planned and pending share one preview lifecycle',()=>{
  assert.equal(lifecycleStatus('Planned'),'planned');
  assert.equal(lifecycleStatus('pending'),'planned');
  assert.equal(lifecycleStatus('Ticket pending'),'planned');
  assert.equal(isEquivalentStatusReview('Status: Notion=planned, GitHub=pending'),true);
});

test('confirmed downgrade blockers are never normalized away',()=>{
  const report={itinerary:{reviews:[
    {message:'Status: Notion=planned, GitHub=pending'},
    {message:'BLOCK: Notion planned would downgrade GitHub confirmed.'}
  ]},reservations:{reviews:[]}};
  const normalized=normalizePreviewReport(report);
  assert.equal(normalized.itinerary.reviews.length,1);
  assert.match(normalized.itinerary.reviews[0].message,/^BLOCK:/);
  assert.equal(normalized.normalization.equivalentStatusReviewsRemoved,1);
});

test('unrelated status differences remain visible',()=>{
  assert.equal(isEquivalentStatusReview('Status: Notion=idea, GitHub=pending'),false);
  assert.equal(isEquivalentStatusReview('Status: Notion=cancelled, GitHub=confirmed'),false);
});
