import {expect,test} from '@playwright/test';

import {ticketDriveFileIds} from '../../data/trip-data.js';

test('the itinerary renders and its primary controls work',async({page})=>{
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));

  await page.goto('/');

  await expect(page).toHaveTitle(/Spain 2026/);
  await expect(page.locator('#countdown')).not.toHaveText('—');
  await expect(page.locator('#days .day')).toHaveCount(18);
  await expect(page.locator('#hotels .hotel')).toHaveCount(4);

  const firstDay=page.locator('#days .day').first();
  await firstDay.locator('.day-main').click();
  await expect(firstDay).toHaveClass(/\bopen\b/);
  await expect(firstDay.locator('.day-main')).toHaveAttribute('aria-expanded','true');

  await page.locator('#search').fill('Alhambra');
  await expect(page.locator('#days .day')).toHaveCount(1);
  await expect(page.locator('#days')).toContainText('Alhambra');

  await page.locator('#search').fill('');
  await expect(page.locator('#days .day')).toHaveCount(18);
  expect(pageErrors).toEqual([]);
});

test('preview Today Mode can open the full itinerary',async({page})=>{
  await page.goto('/?previewDate=2026-10-19');

  const todaySection=page.locator('#todaySection');
  await expect(todaySection).toBeVisible();
  await expect(todaySection.locator('.today-kicker')).toContainText('PREVIEW');

  await page.getByRole('button',{name:/完整今日行程|全部行程/}).click();
  await expect(page.locator('#itinerary')).toBeInViewport();
  await expect(page.getByRole('searchbox',{name:'搜尋行程'})).toBeInViewport();
});

test('a mapped ticket opens its real Google Drive files without the demo QR flow',async({page})=>{
  await page.goto('/?previewDate=2026-10-19');

  const ticketId='tkt-alhambra';
  const trigger=page.locator(`#todaySection [data-ticket-id="${ticketId}"]`).first();
  const modal=page.locator('#ticketModal');

  await trigger.click();

  await expect(modal).toHaveClass(/\bopen\b/);
  await expect(modal).toHaveAttribute('aria-hidden','false');
  await expect(modal).toContainText('Alhambra');
  await expect(modal).not.toContainText(/前端加密示範|示範資料|QR Code|老婆生日/);

  const expectedFileIds=ticketDriveFileIds[ticketId];
  const driveLinks=modal.locator('a[href^="https://drive.google.com/file/d/"]');
  await expect(driveLinks).toHaveCount(expectedFileIds.length);

  for(const fileId of expectedFileIds){
    const link=modal.locator(`a[href="https://drive.google.com/file/d/${fileId}/view"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('target','_blank');
    await expect(link).toHaveAttribute('rel',/\bnoopener\b/);
    await expect(link).toHaveAttribute('rel',/\bnoreferrer\b/);
  }

  await expect(driveLinks.first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(modal).toHaveAttribute('aria-hidden','true');
  await expect(trigger).toBeFocused();
});

test('an unmapped ticket reports that Drive has not synced it yet',async({page})=>{
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));

  await page.goto('/?previewDate=2026-10-11');

  const modal=page.locator('#ticketModal');
  await page.locator('#todaySection [data-ticket-id="tkt-casa-batllo"]').first().click();

  await expect(modal).toHaveClass(/\bopen\b/);
  await expect(modal).toContainText('Casa Batlló');
  await expect(modal).toContainText('尚未同步');
  await expect(modal.locator('a[href*="drive.google.com"]')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
