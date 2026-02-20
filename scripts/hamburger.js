// Hamburger Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileUserSection = document.getElementById('mobileUserSection');
    const mobileLoginSection = document.getElementById('mobileLoginSection');
    const mobileUserName = document.getElementById('mobileUserName');
    const mobileUserAvatar = document.getElementById('mobileUserAvatar');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    const mobileGoogleLogin = document.getElementById('mobileGoogleLogin');
    const body = document.body;
    const header = document.querySelector('header.index');

    // Handle hamburger color change on scroll (white in header, black after)
    function updateHamburgerColor() {
        if (!hamburgerBtn || !header) return;
        
        const headerHeight = header.offsetHeight;
        const scrollPosition = window.scrollY;
        
        if (scrollPosition < headerHeight) {
            hamburgerBtn.classList.add('hamburger-white');
            hamburgerBtn.classList.remove('hamburger-black');
        } else {
            hamburgerBtn.classList.remove('hamburger-white');
            hamburgerBtn.classList.add('hamburger-black');
        }
    }

    // Listen for scroll events
    window.addEventListener('scroll', updateHamburgerColor);
    
    // Initialize hamburger color on page load
    updateHamburgerColor();

    // Toggle menu visibility
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            hamburgerBtn.classList.toggle('active');
            body.classList.toggle('menu-open');
            // Update user profile when hamburger is clicked
            updateUserProfile();
        });
    }

    // Close menu when clicking on a link
    const mobileLinks = document.querySelectorAll('.mobile-menu-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            hamburgerBtn.classList.remove('active');
            body.classList.remove('menu-open');
        });
    });

    // Function to update user profile in mobile menu
    function updateUserProfile() {
        const uid = localStorage.getItem('uid');
        const email = localStorage.getItem('email');
        
        if (uid && email) {
            // User is logged in - get profile data
            const profileData = JSON.parse(localStorage.getItem(`profile_${uid}`) || '{}');
            const userName = profileData.nume || email;
            const userPhotoURL = profileData.poza;
            
            mobileUserSection.style.display = 'block';
            mobileLoginSection.style.display = 'none';
            mobileUserName.textContent = userName;
            
            // Check if user is admin
            const isAdmin = email === "ruxanda.cujba07@gmail.com";
            const userLink = mobileUserSection.querySelector('a.mobile-menu-link');
            if (userLink) {
                userLink.href = isAdmin ? 'pagini/admin.html' : 'pagini/user.html';
            }
            
            if (userPhotoURL) {
                mobileUserAvatar.src = userPhotoURL;
                mobileUserAvatar.style.display = 'block';
            } else {
                mobileUserAvatar.style.display = 'none';
            }
        } else {
            // User is not logged in
            mobileUserSection.style.display = 'none';
            mobileLoginSection.style.display = 'block';
        }
    }

    // Set up logout button
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', function() {
            if (typeof logout === 'function') {
                logout();
            } else {
                // Fallback logout
                const uid = localStorage.getItem('uid');
                localStorage.removeItem('uid');
                localStorage.removeItem('email');
                if (uid) {
                    localStorage.removeItem(`user_${uid}`);
                    localStorage.removeItem(`profile_${uid}`);
                }
                updateUserProfile();
                location.reload();
            }
            mobileMenu.classList.remove('active');
            hamburgerBtn.classList.remove('active');
            body.classList.remove('menu-open');
        });
    }

    // Set up Google login button
    if (mobileGoogleLogin) {
        mobileGoogleLogin.addEventListener('click', function() {
            const googleLoginBtn = document.getElementById('googleLogin');
            if (googleLoginBtn) {
                googleLoginBtn.click();
            }
        });
    }

    // Check user status on page load
    updateUserProfile();

    // Listen for user status changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'uid' || e.key === 'email' || (e.key && e.key.startsWith('profile_'))) {
            updateUserProfile();
        }
    });

    // Close menu when clicking outside (on overlay)
    document.addEventListener('click', function(event) {
        const isClickInsideMenu = mobileMenu.contains(event.target);
        const isClickOnHamburger = hamburgerBtn.contains(event.target);

        if (!isClickInsideMenu && !isClickOnHamburger && mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            hamburgerBtn.classList.remove('active');
            body.classList.remove('menu-open');
        }
    });
});
