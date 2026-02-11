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
    updateCounter();
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
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
