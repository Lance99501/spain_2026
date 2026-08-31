import {expect,test} from '@playwright/test';

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
