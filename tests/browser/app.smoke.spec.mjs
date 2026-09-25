import {readFile} from 'node:fs/promises';
import {expect,test} from '@playwright/test';

const bootstrap=JSON.parse(
  await readFile(new URL('../../data/generated/bootstrap.json',import.meta.url),'utf8')
);
const {ticketDriveFileIds}=bootstrap;

test('the itinerary renders and its primary controls work',async({page})=>{
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));

  await page.goto('/');

  await expect(page).toHaveTitle(/Spain 2026/);
  await expect(page.locator('#countdown')).not.toHaveText('—');
  await expect(page.locator('#days .day')).toHaveCount(18);
  await expect(page.locator('#hotels .hotel')).toHaveCount(4);
  await expect(page.locator('#filters')).toHaveCount(0);
  await expect(page.locator('#search')).toHaveCount(0);

  const firstDay=page.locator('#days .day').first();
  await firstDay.locator('.day-main').click();
  await expect(firstDay).toHaveClass(/\bopen\b/);
  await expect(firstDay.locator('.day-main')).toHaveAttribute('aria-expanded','true');

  await page.locator('#expandAll').click();
  await expect(page.locator('#expandAll')).toContainText('收合本城');
  await expect(page.locator('#days [data-pager-city="Barcelona"] .day:not(.open)')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test('preview Today Mode can open the full itinerary',async({page})=>{
  await page.goto('/?previewDate=2026-10-19');

  const todaySection=page.locator('#todaySection');
  await expect(todaySection).toBeVisible();
  await expect(todaySection.locator('.today-kicker')).toContainText('PREVIEW');
  await expect(todaySection.locator('.next-panel > span')).toHaveText('下一個固定時間');

  await page.getByRole('button',{name:/完整今日行程|全部行程/}).click();
  await expect(page.locator('#itinerary')).toBeInViewport();
  const dayId=await page.locator('#todayRoot .today-card').getAttribute('data-day-id');
  const day=page.locator(`#days .day[data-day-id="${dayId}"]`);
  await expect(day).toHaveClass(/\bopen\b/);
  await expect(day.locator('.day-main')).toHaveAttribute('aria-expanded','true');
  await expect(day.locator('.day-main')).toBeInViewport();
  await expect(page.locator('.today-timeline')).toHaveCount(0);
});

test('a mapped ticket opens its real Google Drive files without the demo QR flow',async({page})=>{
  await page.goto('/?previewDate=2026-10-19');

  const ticketId='tkt-alhambra';
  const trigger=page.locator('#todaySection [data-action="tickets"]');
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

test('Casa Batllo ticket is marked as an official-app ticket',async({page})=>{
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));

  await page.goto('/?previewDate=2026-10-11');

  const modal=page.locator('#ticketModal');
  await page.locator('#todaySection [data-action="tickets"]').click();
  await page.locator('#todayTicketTray [data-ticket-id="tkt-casa-batllo"]').click();

  await expect(modal).toHaveClass(/\bopen\b/);
  await expect(modal).toContainText('Casa Batlló');
  await expect(modal).toContainText('官方 APP');
  await expect(modal).toContainText('已確認');
  await expect(modal).not.toContainText('尚未同步');
  await expect(modal.locator('a[href*="drive.google.com"]')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test('transport days keep a complete Today ticket tray',async({page})=>{
  await page.goto('/?previewDate=2026-10-16');

  const action=page.locator('#todaySection [data-action="tickets"]');
  await expect(action).toContainText('今日票券 3');
  await action.click();

  const tray=page.locator('#todayTicketTray');
  await expect(tray).toBeVisible();
  await expect(tray.locator('[data-ticket-id]')).toHaveCount(3);
});

test('compact mobile layout keeps city switching and map navigation usable',async({page})=>{
  await page.setViewportSize({width:360,height:780});
  await page.goto('/');
  await expect(page.locator('#quickSearchBtn')).toHaveCount(0);
  await expect(page.locator('#quickSearchPanel')).toHaveCount(0);
  await expect(page.locator('#search')).toHaveCount(0);
  await expect(page.locator('#cityGrid img').first()).toBeHidden();
  const geometry=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth>window.innerWidth,
    map:document.querySelector('#mapSection').offsetTop,
    hotels:document.querySelector('#hotelsSection').offsetTop,
    cityHeight:document.querySelector('#cityGrid').getBoundingClientRect().height
  }));
  expect(geometry.overflow).toBe(false);
  expect(geometry.map).toBeGreaterThan(geometry.hotels);
  expect(geometry.cityHeight).toBeLessThan(180);
  await page.locator('#cityGrid [data-city="Madrid"]').click();
  await expect(page.locator('#cityGrid [data-city="Madrid"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-nav-target="map"]').click();
  await expect(page.locator('#mapSection')).toBeInViewport();
  await page.waitForTimeout(1300);
  await expect(page.locator('[data-nav-target="map"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-nav-target="stay"]').click();
  await expect(page.locator('#hotelsSection')).toBeInViewport();
  await expect(page.locator('#placeLanguageToggle')).toBeVisible();
  await expect(page.locator('[data-mapcity="Sevilla"]')).toHaveText('Sevilla＋Córdoba');
  await expect(page.locator('[data-mapcity="Cordoba"]')).toHaveCount(0);
  await page.locator('[data-mapcity="Sevilla"]').click();
  await expect(page.locator('[data-mapcity="Sevilla"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-mapcity="Madrid"]')).toHaveText('Madrid＋Segovia');
  await expect(page.locator('[data-mapcity="Segovia"]')).toHaveCount(0);
  await page.locator('[data-mapcity="Madrid"]').click();
  await expect(page.locator('[data-mapcity="Madrid"]')).toHaveAttribute('aria-pressed','true');
});

test('mobile city bar, title alignment and bottom links match the page',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('[data-nav-target="today"] b')).toHaveText('首頁');
  expect(await page.locator('.app-nav-btn').evaluateAll(nodes=>nodes.map(n=>n.dataset.navTarget))).toEqual(['today','trip','stay','map']);
  const layout=await page.evaluate(()=>{
    const title=document.querySelector('.hero-title-row').getBoundingClientRect();
    const count=document.querySelector('.hero-card').getBoundingClientRect();
    return {centers:Math.abs((title.top+title.bottom-count.top-count.bottom)/2),cityTops:[...document.querySelectorAll('.city-card')].map(n=>n.getBoundingClientRect().top)};
  });
  expect(layout.centers).toBeLessThan(2);
  expect(new Set(layout.cityTops).size).toBe(1);
  for(const [name,id] of [['trip','itinerary'],['stay','hotelsSection'],['map','mapSection']]){
    await page.locator(`[data-nav-target="${name}"]`).click();
    await page.waitForTimeout(1400);
    await expect(page.locator(`[data-nav-target="${name}"]`)).toHaveAttribute('aria-pressed','true');
    const top=await page.locator(`#${id}`).evaluate(n=>n.getBoundingClientRect().top);
    const dockBottom=await page.locator('#cityDock').evaluate(n=>n.getBoundingClientRect().bottom);
    expect(top).toBeGreaterThanOrEqual(dockBottom);
  }
  await page.locator('[data-nav-target="today"]').click();
  await expect(page.locator('.hero')).toBeInViewport();
  await page.goto('/?previewDate=2026-10-19');
  await expect(page.locator('[data-nav-target="today"] b')).toHaveText('今日');
});


test('mobile Demo control stays in the header and opens usable settings',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?demo=1&previewDate=2026-10-19');
  await expect(page.locator('.hero #demoToggle')).toBeVisible();
  await page.locator('#demoToggle').click();
  await expect(page.locator('#demoPanelBody')).toBeInViewport();
  await expect(page.locator('#demoApply')).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(page.locator('#demoPanelBody')).toBeHidden();
  await page.locator('[data-action="all"]').click();
  await page.waitForTimeout(1400);
  const dayId=await page.locator('#todayRoot .today-card').getAttribute('data-day-id');
  const day=page.locator(`#days .day[data-day-id="${dayId}"]`);
  await expect(day).toHaveClass(/\bopen\b/);
  const top=await day.evaluate(n=>n.getBoundingClientRect().top);
  const toolsBottom=await page.locator('.tools').evaluate(n=>n.getBoundingClientRect().bottom);
  expect(top).toBeGreaterThanOrEqual(toolsBottom);
});

test('trip runner follows the demo day and respects reduced motion',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?demo=1&previewDate=2026-10-19');
  await expect(page.locator('#countdown')).toHaveText('DAY 11');
  await expect(page.locator('.trip-progress')).toHaveAttribute('aria-valuenow','65');
  await expect(page.locator('.trip-progress')).toHaveAttribute('aria-valuetext','旅程第 11 / 17 天');
  await expect(page.locator('.trip-runner')).toBeVisible();
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.trip-runner svg')).toHaveCSS('animation-name','none');
});

test('website labels translate raw synced text without changing source data',async({page})=>{
  await page.goto('/?demo=1&previewDate=2026-10-20');
  await page.locator('[data-action="all"]').click();
  const day=page.locator('#days [data-day-id="day-2026-10-20"]');
  await expect(day).toContainText('格拉納達主教座堂 / 皇家禮拜堂 / 阿爾凱塞利亞市集');
  await expect(page.locator('#todayHeading')).toContainText('格拉納達 → 馬德里');
  await expect(day).toContainText('ALVIA 2087 Confort');
  await page.locator('#placeLanguageToggle').click();
  await expect(day).toContainText('Catedral de Granada / Capilla Real / Alcaicería');
  const raw=await page.evaluate(async()=>await(await fetch('./data/generated/bootstrap.json')).json());
  expect(raw.itinerary.find(d=>d.date==='2026-10-20').items[0].segments[0].text).toBe('Granada Cathedral / Capilla Real / Alcaicería');
  await page.locator('#placeLanguageToggle').click();
  await page.locator('#expandAll').click();
  await expect(page.locator('#days [data-day-id="day-2026-10-23"]')).toContainText('麗池公園＋阿爾卡拉門＋西貝萊斯廣場');
});

test('day-trip Today cards use the focus city and avoid bilingual duplicates',async({page})=>{
  await page.goto('/?previewDate=2026-10-16');
  await expect(page.locator('.today-kicker')).toContainText('科爾多瓦');

  await page.goto('/?previewDate=2026-10-22');
  await expect(page.locator('.today-kicker')).toContainText('塞哥維亞');
  await expect(page.locator('#todayHeading')).toHaveText('塞哥維亞 一日遊');
  await expect(page.locator('#todayHeading')).not.toContainText('塞哥維亞｜塞哥維亞');
  await page.locator('#placeLanguageToggle').click();
  await expect(page.locator('#todayHeading')).toHaveText('Segovia 一日遊');
});


test('Madrid weather flex pair keeps each day primary and shows a swap hint',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.locator('#cityGrid [data-city="Madrid"]').click();

  const day21=page.locator('#days [data-day-id="day-2026-10-21"]');
  const day23=page.locator('#days [data-day-id="day-2026-10-23"]');
  await day21.locator('.day-main').click();

  await expect(day21.locator('.day-title')).toContainText('馬德里王宮日');
  await expect(day21).toContainText('馬德里王宮');
  await expect(day21).not.toContainText('普拉多博物館');
  await expect(day21.locator('.flex-pair-hint')).toContainText('可與 10/23 整日互換');
  await expect(day21.locator('.flex-plan-column')).toHaveCount(0);
  await expect(day21.locator('[data-flex-plan]')).toHaveCount(0);
  await expect(day21.locator('.day-map')).toHaveAttribute('href',/Palacio%20Real/);

  await day23.locator('.day-main').click();
  await expect(day23.locator('.day-title')).toContainText('普拉多博物館＋麗池公園');
  await expect(day23).toContainText('普拉多博物館');
  await expect(day23).not.toContainText('馬德里王宮');
  await expect(day23.locator('.flex-pair-hint')).toContainText('可與 10/21 整日互換');
  await expect(day23.locator('.day-map')).toHaveAttribute('href',/Museo%20del%20Prado/);
  expect(await page.evaluate(()=>localStorage.getItem('spain2026:flex:madrid-weather-21-23'))).toBeNull();
});
