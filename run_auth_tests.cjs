const { chromium } = require('playwright-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runTests() {
  console.log('🚀 Starting Comprehensive Authentication Tests for Step 1...');
  
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor console to verify passwords are NOT logged
  let passwordLogged = false;
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Ramesh@123') || text.includes('Suresh@123')) {
      passwordLogged = true;
    }
  });

  const results = [];

  function record(title, passed, details = '') {
    results.push({ title, passed, details });
    console.log(`${passed ? '✅' : '❌'} [${passed ? 'PASS' : 'FAIL'}] ${title} ${details ? '(' + details + ')' : ''}`);
  }

  try {
    // -------------------------------------------------------------
    // Test 0: Clear local storage for clean test run
    // -------------------------------------------------------------
    await page.goto('http://localhost:5173/login');
    await page.evaluate(() => localStorage.clear());

    // -------------------------------------------------------------
    // Test 1: Page Protection
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Page Protection ---');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForURL('**/login', { timeout: 5000 });
    const isAtLogin = page.url().includes('/login');
    record('Protected page redirects unauthenticated user to /login', isAtLogin, `Current URL: ${page.url()}`);

    // Try accessing other protected routes
    await page.goto('http://localhost:5173/crops');
    await page.waitForURL('**/login', { timeout: 5000 });
    record('Accessing /crops redirects to /login', page.url().includes('/login'));

    await page.goto('http://localhost:5173/profile');
    await page.waitForURL('**/login', { timeout: 5000 });
    record('Accessing /profile redirects to /login', page.url().includes('/login'));

    await page.goto('http://localhost:5173/weather');
    await page.waitForURL('**/login', { timeout: 5000 });
    record('Accessing /weather redirects to /login', page.url().includes('/login'));

    await page.goto('http://localhost:5173/advisor');
    await page.waitForURL('**/login', { timeout: 5000 });
    record('Accessing /advisor redirects to /login', page.url().includes('/login'));

    await page.goto('http://localhost:5173/market');
    await page.waitForURL('**/login', { timeout: 5000 });
    record('Accessing /market redirects to /login', page.url().includes('/login'));

    await page.goto('http://localhost:5173/calculator');
    await page.waitForURL('**/login', { timeout: 5000 });
    record('Accessing /calculator redirects to /login', page.url().includes('/login'));

    await page.goto('http://localhost:5173/notifications');
    await page.waitForURL('**/login', { timeout: 5000 });
    record('Accessing /notifications redirects to /login', page.url().includes('/login'));

    await page.goto('http://localhost:5173/irrigation');
    await page.waitForURL('**/login', { timeout: 5000 });
    record('Accessing /irrigation redirects to /login', page.url().includes('/login'));

    // -------------------------------------------------------------
    // Test 2: Registration Validation
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Registration Form Validation ---');
    await page.goto('http://localhost:5173/register');
    await page.waitForSelector('#register-form');

    // Click Continue without entering any info
    await page.click('#reg-next-1');
    const alert1 = await page.locator('.alert-danger').textContent();
    record('Step 1 empty form validation', alert1.includes('Please enter your name.'), alert1.trim());

    // Enter name only
    await page.fill('#reg-name', 'Ramesh');
    await page.click('#reg-next-1');
    const alert2 = await page.locator('.alert-danger').textContent();
    record('Step 1 phone validation', alert2.includes('valid 10-digit phone'), alert2.trim());

    // Enter invalid phone
    await page.fill('#reg-phone', '123');
    await page.click('#reg-next-1');
    const alert3 = await page.locator('.alert-danger').textContent();
    record('Step 1 phone length validation', alert3.includes('valid 10-digit phone'), alert3.trim());

    // -------------------------------------------------------------
    // Test 3: Register Account 1 (Ramesh)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Registration of Account 1 (Ramesh) ---');
    await page.fill('#reg-name', 'Ramesh');
    await page.fill('#reg-phone', '9876543210');
    await page.fill('#reg-email', 'ramesh@example.com');
    await page.fill('#reg-password', 'Ramesh@123');
    await page.click('#reg-next-1');

    // Step 2: Location
    await page.waitForSelector('#reg-district');
    await page.fill('#reg-village', 'Kothapalli');
    await page.fill('#reg-district', 'Guntur');
    await page.selectOption('#reg-state', 'Andhra Pradesh');
    await page.click('#reg-next-2');

    // Step 3: Land & Soil
    await page.waitForSelector('#reg-area');
    await page.fill('#reg-area', '2.5');
    await page.selectOption('#reg-areaunit', 'acres');
    await page.selectOption('#reg-soil', 'Black Cotton');
    await page.selectOption('#reg-water', 'Borewell');
    await page.selectOption('#reg-irrigation', 'Drip');

    // Select crop chips if present
    const chilliChip = page.locator('button:has-text("Chilli")');
    if (await chilliChip.count() > 0) {
      await chilliChip.click();
    }

    // Submit registration
    await page.click('#reg-submit-btn');

    // Verify redirect to /login and success alert
    await page.waitForURL('**/login', { timeout: 5000 });
    const successAlert = await page.locator('#register-success-alert').textContent();
    record(
      'Registration redirects to login with "Registration successful!"',
      successAlert.includes('Registration successful!'),
      successAlert.trim()
    );

    // -------------------------------------------------------------
    // Test 4: Register Account 2 (Suresh)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Registration of Account 2 (Suresh) ---');
    await page.click('#go-to-register-btn');
    await page.waitForURL('**/register');

    await page.fill('#reg-name', 'Suresh');
    await page.fill('#reg-phone', '9876543211');
    await page.fill('#reg-email', 'suresh@example.com');
    await page.fill('#reg-password', 'Suresh@123');
    await page.click('#reg-next-1');

    await page.waitForSelector('#reg-district');
    await page.fill('#reg-village', 'Rampur');
    await page.fill('#reg-district', 'Varanasi');
    await page.selectOption('#reg-state', 'Uttar Pradesh');
    await page.click('#reg-next-2');

    await page.waitForSelector('#reg-area');
    await page.fill('#reg-area', '5');
    await page.selectOption('#reg-areaunit', 'acres');
    await page.selectOption('#reg-soil', 'Alluvial');
    await page.selectOption('#reg-water', 'Canal');
    await page.selectOption('#reg-irrigation', 'Flood');

    await page.click('#reg-submit-btn');
    await page.waitForURL('**/login', { timeout: 5000 });
    const successAlert2 = await page.locator('#register-success-alert').textContent();
    record(
      'Account 2 registration redirects to login with success alert',
      successAlert2.includes('Registration successful!'),
      successAlert2.trim()
    );

    // -------------------------------------------------------------
    // Test 5: Verify Saved Farmers and Unique IDs in localStorage
    // -------------------------------------------------------------
    console.log('\n--- 5. Checking localStorage Persistence & Unique IDs ---');
    const storedFarmers = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('agri_farmers') || '[]');
    });

    record('Both farmers saved in localStorage', storedFarmers.length === 2, `Count: ${storedFarmers.length}`);
    record('Farmer 1 has ID farmer_001', storedFarmers[0]?.id === 'farmer_001' && storedFarmers[0]?.name === 'Ramesh', `ID: ${storedFarmers[0]?.id}`);
    record('Farmer 2 has ID farmer_002', storedFarmers[1]?.id === 'farmer_002' && storedFarmers[1]?.name === 'Suresh', `ID: ${storedFarmers[1]?.id}`);
    record('Farmer 1 details persisted accurately', storedFarmers[0]?.district === 'Guntur' && storedFarmers[0]?.landArea === 2.5);
    record('Farmer 2 details persisted accurately', storedFarmers[1]?.district === 'Varanasi' && storedFarmers[1]?.landArea === 5);

    // -------------------------------------------------------------
    // Test 6: Wrong Credentials Rejection
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Wrong Credentials Rejection ---');
    // Wrong password
    await page.fill('#login-email', 'ramesh@example.com');
    await page.fill('#login-password', 'WrongPassword999');
    await page.click('#login-submit-btn');
    await page.waitForSelector('#login-error-alert');
    const wrongPassText = await page.locator('#login-error-alert').textContent();
    record('Wrong password rejected with exact message', wrongPassText.includes('Invalid email/phone or password.'), wrongPassText.trim());

    // Wrong email
    await page.fill('#login-email', 'unknown_farmer@example.com');
    await page.fill('#login-password', 'Ramesh@123');
    await page.click('#login-submit-btn');
    await page.waitForSelector('#login-error-alert');
    const wrongEmailText = await page.locator('#login-error-alert').textContent();
    record('Unknown email rejected with exact message', wrongEmailText.includes('Invalid email/phone or password.'), wrongEmailText.trim());

    // -------------------------------------------------------------
    // Test 7: Login as Ramesh
    // -------------------------------------------------------------
    console.log('\n--- 7. Logging in as Ramesh ---');
    await page.fill('#login-email', 'ramesh@example.com');
    await page.fill('#login-password', 'Ramesh@123');
    await page.click('#login-submit-btn');
    await page.waitForURL('**/dashboard', { timeout: 5000 });

    const greetingRamesh = await page.locator('.greeting-title').textContent();
    record('Dashboard displays "Hello, Ramesh 👋"', greetingRamesh.includes('Hello, Ramesh 👋'), greetingRamesh.trim());

    const locationRamesh = await page.locator('.greeting-location').textContent();
    record('Dashboard displays Ramesh location', locationRamesh.includes('Guntur') && locationRamesh.includes('Andhra Pradesh'), locationRamesh.trim());

    // Check session in localStorage
    const sessionRamesh = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('agri_current_user') || '{}');
    });
    record('Current user stored as Ramesh', sessionRamesh.id === 'farmer_001' && sessionRamesh.name === 'Ramesh', `User: ${sessionRamesh.name} (${sessionRamesh.id})`);
    record('Session object does NOT contain password', sessionRamesh.password === undefined, 'Password omitted from session');

    // Page Refresh Test
    await page.reload();
    await page.waitForSelector('.greeting-title');
    const greetingAfterRefresh = await page.locator('.greeting-title').textContent();
    record('Session persists after page reload', greetingAfterRefresh.includes('Hello, Ramesh 👋'), greetingAfterRefresh.trim());

    // -------------------------------------------------------------
    // Test 8: Add Crop for Ramesh (to test data separation)
    // -------------------------------------------------------------
    console.log('\n--- 8. Adding Crop for Ramesh ---');
    await page.goto('http://localhost:5173/crops/add');
    await page.waitForSelector('#crop-name-select');
    await page.selectOption('#crop-name-select', 'Chilli');
    await page.fill('#land-area', '1.5');
    await page.fill('#planting-date', '2026-09-01');
    await page.click('#submit-add-crop');
    try {
      await page.waitForURL('**/crops', { timeout: 6000 });
    } catch (e) {
      const errAlert = await page.locator('.alert-danger').allTextContents();
      console.log('Crops add error alert:', errAlert);
      throw e;
    }
    
    // Check crop stored with Ramesh's farmerId
    const crops = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('agri_crops') || '[]');
    });
    record('Crop created with Ramesh farmerId', crops.length > 0 && crops[0].farmerId === 'farmer_001', `Crop farmerId: ${crops[0]?.farmerId}`);

    // Check Dashboard stats for Ramesh
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForSelector('.greeting-stats');
    const rameshActiveCrops1 = await page.locator('.greeting-stats .stat-item:first-child .stat-value').textContent();
    record('Ramesh sees 1 active crop on dashboard', rameshActiveCrops1.trim() === '1', `Active crops: ${rameshActiveCrops1.trim()}`);

    // -------------------------------------------------------------
    // Test 9: Logout Ramesh
    // -------------------------------------------------------------
    console.log('\n--- 9. Testing Logout ---');
    await page.click('#navbar-logout-btn');
    await page.waitForURL('**/login', { timeout: 5000 });
    record('Logout redirects to /login', page.url().includes('/login'));

    const sessionAfterLogout = await page.evaluate(() => {
      return localStorage.getItem('agri_current_user');
    });
    record('Active session cleared after logout', sessionAfterLogout === null);

    const farmersAfterLogout = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('agri_farmers') || '[]');
    });
    record('Logout does NOT delete registered farmer accounts', farmersAfterLogout.length === 2, `Farmers remaining: ${farmersAfterLogout.length}`);

    // -------------------------------------------------------------
    // Test 10: Login as Suresh (using Phone Number)
    // -------------------------------------------------------------
    console.log('\n--- 10. Logging in as Suresh (via Phone Number) ---');
    await page.fill('#login-email', '9876543211'); // Phone login
    await page.fill('#login-password', 'Suresh@123');
    await page.click('#login-submit-btn');
    await page.waitForURL('**/dashboard', { timeout: 5000 });

    const greetingSuresh = await page.locator('.greeting-title').textContent();
    record('Dashboard displays "Hello, Suresh 👋"', greetingSuresh.includes('Hello, Suresh 👋'), greetingSuresh.trim());

    const locationSuresh = await page.locator('.greeting-location').textContent();
    record('Dashboard displays Suresh location', locationSuresh.includes('Varanasi') && locationSuresh.includes('Uttar Pradesh'), locationSuresh.trim());

    const sureshActiveCrops = await page.locator('.greeting-stats .stat-item:first-child .stat-value').textContent();
    record('Suresh has 0 active crops (Ramesh crops isolated)', sureshActiveCrops.trim() === '0', `Count: ${sureshActiveCrops.trim()}`);

    // -------------------------------------------------------------
    // Test 11: Logout Suresh & Relogin as Ramesh
    // -------------------------------------------------------------
    console.log('\n--- 11. Relogging in as Ramesh to verify persistence ---');
    await page.click('#navbar-logout-btn');
    await page.waitForURL('**/login');

    await page.fill('#login-email', 'ramesh@example.com');
    await page.fill('#login-password', 'Ramesh@123');
    await page.click('#login-submit-btn');
    await page.waitForURL('**/dashboard');

    const greetingRameshAgain = await page.locator('.greeting-title').textContent();
    record('Ramesh can log back in and greeting is correct', greetingRameshAgain.includes('Hello, Ramesh 👋'), greetingRameshAgain.trim());

    const rameshActiveCrops2 = await page.locator('.greeting-stats .stat-item:first-child .stat-value').textContent();
    record('Ramesh active crop still present (data persistence)', rameshActiveCrops2.trim() === '1', `Count: ${rameshActiveCrops2.trim()}`);

    // -------------------------------------------------------------
    // Test 12: Password Security Check
    // -------------------------------------------------------------
    console.log('\n--- 12. Password Security Verification ---');
    record('No password printed to console', !passwordLogged);

  } catch (error) {
    console.error('Test run error:', error);
    record('Execution completed without error', false, error.message);
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n========================================');
  console.log('SUMMARY OF STEP 1 AUTHENTICATION TESTS:');
  console.log('========================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log('========================================\n');
}

runTests();
