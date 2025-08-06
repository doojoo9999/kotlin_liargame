// Test script to validate the applied fix
console.log('[DEBUG_LOG] Validating the applied fix...');

// Mock the exact scenario from the issue description
const mockCurrentRoom = {
  gameNumber: 1,
  title: null,
  gameName: "테스트00님의 방",
  subject: {
    id: 1,
    name: "음식",
    wordIds: [1, 2, 3, 4, 5]
  },
  subjects: null,
  gameState: 'WAITING'
};

console.log('[DEBUG_LOG] Testing the FIXED logic from GameRoomPage.jsx...');

// This simulates the exact logic now in GameRoomPage.jsx line 242-244
const roomTitle = mockCurrentRoom.title || `${mockCurrentRoom.gameName || '제목 없음'} #${mockCurrentRoom.gameNumber}`;
const subjectsDisplay = mockCurrentRoom.subjects && mockCurrentRoom.subjects.length > 0 && ` - [${mockCurrentRoom.subjects.join(', ')}]`;
const subjectDisplay = !mockCurrentRoom.subjects && mockCurrentRoom.subject && ` - [${mockCurrentRoom.subject?.name || mockCurrentRoom.subject?.content || '주제 없음'}]`;

const fullDisplay = roomTitle + (subjectsDisplay || '') + (subjectDisplay || '');

console.log('[DEBUG_LOG] Room title part:', roomTitle);
console.log('[DEBUG_LOG] Subjects display part:', subjectsDisplay || '(none)');
console.log('[DEBUG_LOG] Subject display part:', subjectDisplay);
console.log('[DEBUG_LOG] Full display result:', fullDisplay);

// Expected result should be: "테스트00님의 방 #1 - [음식]"
const expectedResult = "테스트00님의 방 #1 - [음식]";
const isCorrect = fullDisplay === expectedResult;

console.log('[DEBUG_LOG] Expected result:', expectedResult);
console.log('[DEBUG_LOG] Actual result:', fullDisplay);
console.log('[DEBUG_LOG] Results match:', isCorrect);
console.log('[DEBUG_LOG] No "[object Object]" in result:', !fullDisplay.includes('[object Object]'));

// Test additional scenarios
console.log('\n[DEBUG_LOG] Testing additional scenarios...');

// Scenario 1: Subject with content property
const roomWithContent = {
  ...mockCurrentRoom,
  subject: { id: 2, content: "동물", wordIds: [1, 2, 3] }
};

const contentTitle = roomWithContent.title || `${roomWithContent.gameName || '제목 없음'} #${roomWithContent.gameNumber}`;
const contentSubjectDisplay = !roomWithContent.subjects && roomWithContent.subject && 
  ` - [${roomWithContent.subject?.name || roomWithContent.subject?.content || '주제 없음'}]`;
const contentFullDisplay = contentTitle + (contentSubjectDisplay || '');

console.log('[DEBUG_LOG] Content scenario result:', contentFullDisplay);
console.log('[DEBUG_LOG] Content scenario expected: "테스트00님의 방 #1 - [동물]"');
console.log('[DEBUG_LOG] Content scenario correct:', contentFullDisplay === "테스트00님의 방 #1 - [동물]");

// Scenario 2: No subject
const roomWithoutSubject = {
  ...mockCurrentRoom,
  subject: null
};

const noSubjectTitle = roomWithoutSubject.title || `${roomWithoutSubject.gameName || '제목 없음'} #${roomWithoutSubject.gameNumber}`;
const noSubjectDisplay = !roomWithoutSubject.subjects && roomWithoutSubject.subject && 
  ` - [${roomWithoutSubject.subject?.name || roomWithoutSubject.subject?.content || '주제 없음'}]`;
const noSubjectFullDisplay = noSubjectTitle + (noSubjectDisplay || '');

console.log('[DEBUG_LOG] No subject scenario result:', noSubjectFullDisplay);
console.log('[DEBUG_LOG] No subject scenario expected: "테스트00님의 방 #1"');
console.log('[DEBUG_LOG] No subject scenario correct:', noSubjectFullDisplay === "테스트00님의 방 #1");

// Final validation
const allTestsPassed = isCorrect && 
  !fullDisplay.includes('[object Object]') &&
  contentFullDisplay === "테스트00님의 방 #1 - [동물]" &&
  noSubjectFullDisplay === "테스트00님의 방 #1";

if (allTestsPassed) {
  console.log('\n[SUCCESS] All tests passed! The fix is working correctly.');
  console.log('[SUCCESS] Room numbers now display properly instead of "[object Object]".');
} else {
  console.log('\n[ERROR] Some tests failed! The fix may need adjustment.');
}

console.log('[DEBUG_LOG] Fix validation completed!');