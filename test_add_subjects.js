const axios = require('axios');

// Test script to add subjects and verify they appear in the dropdown
async function addTestSubjects() {
    console.log('[TEST] Starting subject addition test...');
    
    const baseURL = 'http://localhost:20021/api/v1';
    
    // Test subjects to add
    const testSubjects = [
        '동물',
        '음식',
        '영화',
        '스포츠',
        '여행지'
    ];
    
    // Step 1: Get initial subject list
    console.log('\n=== Step 1: Check initial subject list ===');
    try {
        const response = await axios.get(`${baseURL}/subjects/listsubj`);
        console.log('[SUCCESS] Initial subjects:', response.data);
        console.log('[COUNT] Initial subject count:', response.data.length);
    } catch (error) {
        console.log('[ERROR] Failed to get initial subjects');
        console.log('[STATUS]', error.response?.status);
        console.log('[ERROR_DATA]', error.response?.data);
        return;
    }
    
    // Step 2: Add test subjects
    console.log('\n=== Step 2: Adding test subjects ===');
    for (const subjectName of testSubjects) {
        try {
            console.log(`[ADDING] Subject: ${subjectName}`);
            const response = await axios.post(`${baseURL}/subjects/applysubj`, {
                name: subjectName
            });
            console.log(`[SUCCESS] Added subject: ${subjectName}`, response.data);
        } catch (error) {
            console.log(`[ERROR] Failed to add subject: ${subjectName}`);
            console.log('[STATUS]', error.response?.status);
            console.log('[ERROR_DATA]', error.response?.data);
        }
    }
    
    // Step 3: Verify subjects were added
    console.log('\n=== Step 3: Verify subjects were added ===');
    try {
        const response = await axios.get(`${baseURL}/subjects/listsubj`);
        console.log('[SUCCESS] Final subjects:', response.data);
        console.log('[COUNT] Final subject count:', response.data.length);
        
        // Check if our test subjects are present
        const subjectNames = response.data.map(subject => subject.content || subject.name);
        console.log('[SUBJECT_NAMES]', subjectNames);
        
        for (const testSubject of testSubjects) {
            if (subjectNames.includes(testSubject)) {
                console.log(`[✓] Subject "${testSubject}" found in list`);
            } else {
                console.log(`[✗] Subject "${testSubject}" NOT found in list`);
            }
        }
        
    } catch (error) {
        console.log('[ERROR] Failed to get final subjects');
        console.log('[STATUS]', error.response?.status);
        console.log('[ERROR_DATA]', error.response?.data);
    }
    
    console.log('\n=== Test Summary ===');
    console.log('This test adds sample subjects and verifies they appear in the API response.');
    console.log('If successful, the frontend dropdown should now show these subjects.');
}

// Run the test
addTestSubjects().catch(console.error);