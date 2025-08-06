// Test script to reproduce the room display issue
console.log('[DEBUG_LOG] Testing room display issue reproduction...');

// Mock subject object that causes the "[object Object]" issue
const mockSubject = {
  id: 1,
  name: "음식",
  wordIds: [1, 2, 3, 4, 5]
};

// Mock currentRoom object that would cause the issue
const mockCurrentRoom = {
  gameNumber: 1,
  title: null,
  gameName: "테스트00님의 방",
  subject: mockSubject,  // This is an object, not a string
  subjects: null,
  gameState: 'WAITING'
};

console.log('[DEBUG_LOG] Mock currentRoom:', JSON.stringify(mockCurrentRoom, null, 2));

// Reproduce the BROKEN logic from GameRoomPage.jsx line 242-244
console.log('\n[DEBUG_LOG] Testing BROKEN room title display logic...');

const brokenTitle = mockCurrentRoom.title || `${mockCurrentRoom.gameName || '제목 없음'} #${mockCurrentRoom.gameNumber}`;
const brokenSubjectDisplay = !mockCurrentRoom.subjects && mockCurrentRoom.subject && ` - [${mockCurrentRoom.subject}]`;

console.log('[DEBUG_LOG] Broken title part:', brokenTitle);
console.log('[DEBUG_LOG] Broken subject part:', brokenSubjectDisplay);
console.log('[DEBUG_LOG] Full broken display:', brokenTitle + (brokenSubjectDisplay || ''));

// This should show: "테스트00님의 방 #1 - [[object Object]]"
console.log('[DEBUG_LOG] Subject type:', typeof mockCurrentRoom.subject);
console.log('[DEBUG_LOG] Subject string conversion:', String(mockCurrentRoom.subject));

// Test the FIXED logic
console.log('\n[DEBUG_LOG] Testing FIXED room title display logic...');

const fixedTitle = mockCurrentRoom.title || `${mockCurrentRoom.gameName || '제목 없음'} #${mockCurrentRoom.gameNumber}`;
const fixedSubjectDisplay = !mockCurrentRoom.subjects && mockCurrentRoom.subject && 
  ` - [${mockCurrentRoom.subject?.name || mockCurrentRoom.subject?.content || '주제 없음'}]`;

console.log('[DEBUG_LOG] Fixed title part:', fixedTitle);
console.log('[DEBUG_LOG] Fixed subject part:', fixedSubjectDisplay);
console.log('[DEBUG_LOG] Full fixed display:', fixedTitle + (fixedSubjectDisplay || ''));

// This should show: "테스트00님의 방 #1 - [음식]"

// Test edge cases
console.log('\n[DEBUG_LOG] Testing edge cases...');

// Case 1: Subject with content instead of name
const subjectWithContent = { id: 2, content: "동물", wordIds: [1, 2, 3] };
const roomWithContent = { ...mockCurrentRoom, subject: subjectWithContent };
const contentDisplay = !roomWithContent.subjects && roomWithContent.subject && 
  ` - [${roomWithContent.subject?.name || roomWithContent.subject?.content || '주제 없음'}]`;
console.log('[DEBUG_LOG] Subject with content display:', contentDisplay);

// Case 2: Subject with both name and content
const subjectWithBoth = { id: 3, name: "스포츠", content: "운동", wordIds: [1, 2, 3] };
const roomWithBoth = { ...mockCurrentRoom, subject: subjectWithBoth };
const bothDisplay = !roomWithBoth.subjects && roomWithBoth.subject && 
  ` - [${roomWithBoth.subject?.name || roomWithBoth.subject?.content || '주제 없음'}]`;
console.log('[DEBUG_LOG] Subject with both name and content display:', bothDisplay);

// Case 3: No subject
const roomWithoutSubject = { ...mockCurrentRoom, subject: null };
const noSubjectDisplay = !roomWithoutSubject.subjects && roomWithoutSubject.subject && 
  ` - [${roomWithoutSubject.subject?.name || roomWithoutSubject.subject?.content || '주제 없음'}]`;
console.log('[DEBUG_LOG] No subject display:', noSubjectDisplay || '(no subject display)');

// Validation
console.log('\n[DEBUG_LOG] Validation Results:');
const brokenResult = brokenTitle + (brokenSubjectDisplay || '');
const fixedResult = fixedTitle + (fixedSubjectDisplay || '');

console.log('[DEBUG_LOG] Broken result contains "[object Object]":', brokenResult.includes('[object Object]'));
console.log('[DEBUG_LOG] Fixed result contains "[object Object]":', fixedResult.includes('[object Object]'));
console.log('[DEBUG_LOG] Fixed result shows proper subject name:', fixedResult.includes('[음식]'));

if (brokenResult.includes('[object Object]') && !fixedResult.includes('[object Object]') && fixedResult.includes('[음식]')) {
  console.log('[SUCCESS] Room display fix is working correctly!');
  console.log('[SUCCESS] Issue reproduction confirmed and fix validated.');
} else {
  console.log('[ERROR] Room display fix validation failed!');
}

console.log('[DEBUG_LOG] Room display issue test completed!');