export function lifecycleStatus(value){
  const status=String(value||'').trim().toLowerCase();
  if(status==='planned'||status==='pending'||status==='ticket pending') return 'planned';
  return status||null;
}

export function isEquivalentStatusReview(message=''){
  const match=String(message).match(/^Status: Notion=([^,]+), GitHub=(.+)$/);
  if(!match) return false;
  const notion=lifecycleStatus(match[1]);
  const github=lifecycleStatus(match[2]);
  return Boolean(notion&&github&&notion===github);
}

export function normalizePreviewReport(input){
  const report=structuredClone(input);
  let removed=0;
  if(report.itinerary?.reviews){
    report.itinerary.reviews=report.itinerary.reviews.filter(review=>{
      if(isEquivalentStatusReview(review.message)){removed+=1;return false;}
      return true;
    });
  }
  if(report.reservations?.reviews){
    report.reservations.reviews=report.reservations.reviews.filter(review=>{
      if(isEquivalentStatusReview(review.message)){removed+=1;return false;}
      return true;
    });
  }
  report.normalization={equivalentStatusReviewsRemoved:removed,planningEquivalence:['planned','pending','ticket pending']};
  return report;
}
