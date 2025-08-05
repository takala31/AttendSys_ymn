// Chrome Debug Helper - Add this to your HTML temporarily for debugging
console.log('=== Chrome Compatibility Debug ===');
console.log('User Agent:', navigator.userAgent);
console.log('Chrome Version:', navigator.userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'Not Chrome');
console.log('LocalStorage Available:', typeof(Storage) !== "undefined");
console.log('Current URL:', window.location.href);
console.log('Protocol:', window.location.protocol);

// Test localStorage
try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('LocalStorage: Working');
} catch (e) {
    console.error('LocalStorage: Failed', e);
}

// Test AttendSys initialization
console.log('AttendSys Data:', typeof attendSysData);
console.log('Init Function:', typeof initAttendSys);

// Test Bootstrap
console.log('Bootstrap:', typeof bootstrap);

console.log('=== End Debug ===');
