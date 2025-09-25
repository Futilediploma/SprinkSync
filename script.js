// SprinkSync Landing Page - Professional JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize subtle scroll animations
    initScrollAnimations();
});

// Simple scroll animations with intersection observer
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Apply subtle fade-in animation to timeline items
    document.querySelectorAll('.timeline-item').forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(item);
    });
}

// Field Fab navigation function
function tryFieldFab() {
    const button = document.querySelector('.primary-button');
    const originalText = button.textContent;
    
    // Simple loading state
    button.textContent = 'Loading...';
    button.disabled = true;
    button.style.opacity = '0.7';
    
    // Navigate to Field Fab after brief delay
    setTimeout(() => {
<<<<<<< HEAD
        window.location.href = 'http://localhost:5173/';
=======
        window.location.href = '/fieldfab/';
>>>>>>> 720097817c90c11f8eb0a86e420af40f3b03a16b
    }, 500);
    
    // Restore button state as fallback
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.style.opacity = '1';
    }, 2000);
<<<<<<< HEAD
}
=======
}
>>>>>>> 720097817c90c11f8eb0a86e420af40f3b03a16b
