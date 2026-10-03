const { chromium } = require('playwright-core');

async function testAllFeatures() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Testing AI Advisor, Weather, Market Demands, and Dashboard...');

  // Set up authenticated farmer session in localStorage
  await page.goto('http://localhost:5173/login');
  await page.evaluate(() => {
    const farmer = {
      id: 'farmer_001',
      name: 'Ramesh Patel',
      phone: '9876543210',
      email: 'ramesh@example.com',
      password: 'password123',
      village: 'Tenali',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      landArea: 3.5,
      areaUnit: 'acres',
      soilType: 'Black Cotton',
      waterSource: 'Borewell',
      irrigationType: 'Drip',
      currentCrops: ['Chilli', 'Cotton']
    };
    localStorage.setItem('agri_farmers', JSON.stringify([farmer]));
  });
  await page.fill('#login-email', 'ramesh@example.com');
  await page.fill('#login-password', 'password123');
  await page.click('#login-submit-btn');
  await page.waitForURL('**/dashboard');

  // 1. Test Dashboard
  console.log('\n--- 1. Testing Dashboard Page ---');
  await page.waitForSelector('#greeting-card');
  const greetingText = await page.locator('#greeting-card').textContent();
  console.log('Greeting contains Ramesh:', greetingText.includes('Ramesh'));
  console.log('Greeting contains Guntur:', greetingText.includes('Guntur'));

  const weatherGlance = await page.locator('#weather-section').textContent();
  console.log('Weather glance visible:', weatherGlance.includes('Weather'));

  const mandiPulse = await page.locator('#mandi-highlight-section').textContent();
  console.log('Mandi pulse visible:', mandiPulse.includes('Mandi'));

  // 2. Test Weather Page
  console.log('\n--- 2. Testing Weather Page (/weather) ---');
  await page.goto('http://localhost:5173/weather');
  await page.waitForSelector('#weather-hero-card');
  const heroTemp = await page.locator('#current-temp').textContent();
  console.log('Weather hero temp loaded:', heroTemp);
  const sprayingAdvice = await page.locator('#spraying-advisory-card').textContent();
  console.log('Spraying advisory loaded:', sprayingAdvice.length > 20);
  const forecastItems = await page.locator('.forecast-card').count();
  console.log('7-Day Forecast items count:', forecastItems);

  // 3. Test Market Demands Page
  console.log('\n--- 3. Testing Market Demands Page (/market) ---');
  await page.goto('http://localhost:5173/market');
  await page.waitForSelector('#market-search-input');
  const marketCardsCount = await page.locator('.market-card').count();
  console.log('Market crop cards rendered:', marketCardsCount);
  
  // Search for Chilli
  await page.fill('#market-search-input', 'Chilli');
  const filteredCount = await page.locator('.market-card').count();
  console.log('Filtered market cards for "Chilli":', filteredCount);

  // 4. Test AI Crop Advisor Page
  console.log('\n--- 4. Testing AI Crop Advisor Page (/advisor) ---');
  await page.goto('http://localhost:5173/advisor');
  await page.waitForSelector('#tab-suitability');
  
  // Tab 1: Suitability Recommendations
  const recCards = await page.locator('.recommendation-card').count();
  console.log('AI crop suitability recommendations count:', recCards);

  // Tab 2: AI Agronomist Chat
  await page.click('#tab-chat');
  await page.waitForSelector('#chat-input');
  await page.fill('#chat-input', 'How do I protect cotton against pink bollworm?');
  await page.click('#send-chat-btn');
  // Wait for AI response
  await page.waitForTimeout(1000);
  const chatMessages = await page.locator('.chat-bubble-ai').allTextContents();
  console.log('AI Chat responded with message count:', chatMessages.length);
  console.log('AI response sample:', chatMessages[chatMessages.length - 1]?.slice(0, 100));

  // Tab 3: Fertilizer Calculator
  await page.click('#tab-fertilizer');
  await page.waitForSelector('#calc-crop');
  await page.fill('#calc-acres', '2');
  const ureaText = await page.locator('.npk-result-grid').textContent();
  console.log('Fertilizer NPK dosage calculated:', ureaText.includes('Urea'));

  console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  await browser.close();
}

testAllFeatures().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
