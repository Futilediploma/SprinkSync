document.addEventListener('DOMContentLoaded', () => {
  // Your landing-page JS here.
  // If you want to redirect later, uncomment and update the target.
  // window.location.assign('/fieldfab/');
});

// Make functions globally available for onclick handlers
window.tryFieldFab = function() {
  // Navigate to the Field Fab application
  window.location.href = '/fieldfab/';
};

window.tryScheduleExtractor = function() {
  // Navigate to the Schedule Extractor application
  window.location.href = '/schedule-extractor/';
};
