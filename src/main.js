document.addEventListener('DOMContentLoaded', () => {
  // Your landing-page JS here.
  // If you want to redirect later, uncomment and update the target.
  // window.location.assign('/fieldfab/');
});

// Make function globally available for onclick handler
window.tryFieldFab = function() {
  // Navigate to the Field Fab application
  window.location.href = '/fieldfab/';
};
