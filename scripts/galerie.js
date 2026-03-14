let currentImageIndex = 0;
let images = [];

// Initialize gallery
document.addEventListener('DOMContentLoaded', function() {
    const galerieContainer = document.getElementById('galerieContainer');
    images = Array.from(galerieContainer.querySelectorAll('.galerie-image'));
    
    // Add click event to each image
    images.forEach((img, index) => {
        img.addEventListener('click', function() {
            openLightbox(index);
        });
        img.style.cursor = 'pointer';
    });

    // Lightbox elements
    const lightbox = document.getElementById('lightbox');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const closeBtn = document.getElementById('closeLightbox');
    const lightboxImg = document.getElementById('lightbox-image');

    // Close button
    closeBtn.addEventListener('click', closeLightbox);

    // Click outside image to close
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Previous button
    prevBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        showPreviousImage();
    });

    // Next button
    nextBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        showNextImage();
    });

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (lightbox.style.display === 'flex') {
            if (e.key === 'ArrowLeft') {
                showPreviousImage();
            } else if (e.key === 'ArrowRight') {
                showNextImage();
            } else if (e.key === 'Escape') {
                closeLightbox();
            }
        }
    });

    // Touch / swipe navigation for mobile devices
    let touchStartX = 0;
    let touchStartY = 0;
    lightbox.addEventListener('touchstart', function(e) {
        const t = e.changedTouches[0];
        touchStartX = t.screenX;
        touchStartY = t.screenY;
    }, { passive: true });

    lightbox.addEventListener('touchend', function(e) {
        const t = e.changedTouches[0];
        const dx = t.screenX - touchStartX;
        const dy = t.screenY - touchStartY;
        // Only consider mostly-horizontal swipes with a minimum distance
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
            if (dx < 0) {
                showNextImage();
            } else {
                showPreviousImage();
            }
        }
    }, { passive: true });

    // Update counter
    updateCounter();
});

function openLightbox(index) {
    currentImageIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-image');
    
    lightboxImg.src = images[currentImageIndex].src;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // add class so header hamburger icons become white while lightbox is open
    document.body.classList.add('lightbox-open');
    updateCounter();
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
    // restore hamburger icon color
    document.body.classList.remove('lightbox-open');
}

function showPreviousImage() {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    const lightboxImg = document.getElementById('lightbox-image');
    lightboxImg.src = images[currentImageIndex].src;
    updateCounter();
}

function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    const lightboxImg = document.getElementById('lightbox-image');
    lightboxImg.src = images[currentImageIndex].src;
    updateCounter();
}

function updateCounter() {
    const counter = document.getElementById('imageCounter');
    counter.textContent = `${currentImageIndex + 1} / ${images.length}`;
}
