// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Optional: Add scroll-based navbar background
window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
        document.querySelector('header').style.backgroundColor = '#ffffff';
        document.querySelector('header').style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    } else {
        document.querySelector('header').style.backgroundColor = 'transparent';
        document.querySelector('header').style.boxShadow = 'none';
    }
});

function openIg(){
    window.open("https://instagram.com/rdrsxm", "_blank");
}