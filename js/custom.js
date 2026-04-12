$(function() {

    "use strict";

    /* ----------------------------------------------------------- */
    /*  REMOVE # FROM URL
    /* ----------------------------------------------------------- */

    $("a[href='#']").on("click", (function(e) {
        e.preventDefault();
    }));

    /* ----------------------------------------------------------- */
    /*  MENU ANIMATION
    /* ----------------------------------------------------------- */

    $('#navigation li a').on('click', function () {
        setTimeout(function() {
            $('.navigation-trigger').click();
        }, 800);
    });
    var offset = 300;
    var navigationContainer = $('#navigation'),
        mainNavigation = navigationContainer.find('#main-navigation ul');
    checkMenu();
    $('.navigation-trigger').on('click', function(){
        $(this).toggleClass('menu-is-open');
        mainNavigation.off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend').toggleClass('is-visible');
        setTimeout(function() {
            ResumeCarousels();
        }, 1200);
    });
    function checkMenu() {
        navigationContainer.find('.navigation-trigger').one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(){
            mainNavigation.addClass('has-transitions');
        });
    }

    /* ----------------------------------------------------------- */
    /*  PORTFOLIO GRID ITEM ANIMATION ON HOVER
    /* ----------------------------------------------------------- */

    $('.grid__item a').each(function() {
        $(this).on('mouseenter', function() {
            var portfolioTitle = $('.item-title-hover');
            if ($(this).data('title')) {
                portfolioTitle.html($(this).data('title') + '<span class="item-category">' + $(this).data('category') + '</span>');
                portfolioTitle.addClass('visible');
            }
            $(document).on('mousemove', function(e) {
                $('.item-title-hover').css({
                    left: e.clientX - 10,
                    top: e.clientY + 25
                });
            });
        }).on('mouseleave', function() {
            $('.item-title-hover').removeClass('visible');
        });
    });

    /* ----------------------------------------------------------- */
    /*  PAGE TRANSITION
    /* ----------------------------------------------------------- */

    var links = [...document.querySelectorAll('.link-page')];
    var breaker = document.querySelector('#transitionblock');
    links.forEach(link => link.addEventListener('click', function (e) {
        var $el = $(this);
        setTimeout(function () {
            $('#main-navigation li a').removeClass('active');
            $el.addClass('active');
        }, 1000);
        e.preventDefault();
        var page = link.getAttribute("href");
        if (document.querySelector(page)) {
            if (page != "#home") {
                setTimeout(function () {
                    $('#wrapper').css('overflow','auto');
                    $( ".simplebar-content-wrapper" ).css('overflow', 'auto');
                }, 1000);
            } else {
                setTimeout(function () {
                    $('#wrapper').css('overflow','hidden');
                    $( ".simplebar-content-wrapper" ).css('overflow', 'hidden');
                }, 1000);
            }
            function transitionblock() {
                breaker.style.display = 'block';
                breaker.addEventListener('animationend', function () {
                    this.style.display = "none";
                })
            }
            transitionblock()
            function changepage() {
                var pages = links.map(a => a.getAttribute("href"))
                setTimeout(function () {
                    pages.forEach(a => {
                        const el = document.querySelector(a);
                        if (el) el.style.display = 'none';
                    });
                    document.querySelector(page).style.display = 'block';
                    
                    // Reset scroll properly for window and simplebar
                    window.scrollTo(0, 0);
                    
                    try {
                        const wrapperDiv = document.querySelector('#wrapper');
                        if (wrapperDiv && wrapperDiv.SimpleBar) {
                            wrapperDiv.SimpleBar.getScrollElement().scrollTop = 0;
                        } else {
                            if (document.querySelector('.simplebar-content-wrapper')) {
                                document.querySelector('.simplebar-content-wrapper').scrollTop = 0;
                            }
                            wrapperDiv.scrollTop = 0;
                        }
                    } catch(e) {}
                    
                }, 1000);
            }
            changepage()
        }
    }))

    /* ----------------------------------------------------------- */
    /*  EXPERIENCE & EDUCATION CAROUSELS
    /* ----------------------------------------------------------- */
    function ResumeCarousels() {
        $('#experience').on('click', function () {
            $('#experience').addClass('active');
            $('#education').removeClass('active');
            $('#education-hierarchy').removeClass('visiblecarousel').addClass('hiddencarousel');
            $('#experiencecarousel').removeClass('hiddencarousel').addClass('visiblecarousel');
            /* OwlCarousel Removed for Experience Timeline */
        });
        $('#education').on('click', function () {
            /* $('#experiencecarousel').owlCarousel('destroy'); */
            $('#education').addClass('active');
            $('#experience').removeClass('active');
            $('#experiencecarousel').removeClass('visiblecarousel').addClass('hiddencarousel');
            $('#education-hierarchy').removeClass('hiddencarousel').addClass('visiblecarousel');
        })
    }
    if ($("body").hasClass("index")) {
        /* OwlCarousel Removed */
        ResumeCarousels();
    }
    /* ----------------------------------------------------------- */
    /*  RE-INITALIZE EXPERIENCE CAROUSEL IF ABOUT SECTION WAS HIDDEN
    /* ----------------------------------------------------------- */

    $('.link-about').on('click', function() {
        setTimeout(function () {
            /* OwlCarousel Removed */
        }, 2000);
    });

    /* ----------------------------------------------------------- */
    /*  UPDATE ACTIVE ITEMS IN NAVIGATION
    /* ----------------------------------------------------------- */

    $('#link-about').on('click', function() {
        setTimeout(function () {
            $('#main-navigation li a').removeClass('active');
            $('#main-navigation li a.link-about').addClass('active');
            if ($('.navigation-trigger').hasClass('menu-is-open')) {
                $('.navigation-trigger').click();
            }
            ResumeCarousels();
        }, 1000);
    });

    /* ----------------------------------------------------------- */
    /*  AJAX CONTACT FORM
    /* ----------------------------------------------------------- */

    $(".formcontact").on("submit", async function(e) {
        e.preventDefault();
        
        const name = $("#contact-name").val();
        const email = $("#contact-email").val();
        const phone = $("#contact-phone").val();
        const subject = $("#contact-subject").val();
        const message = $(this).find("textarea[name='message']").val();

        // Validation: Email OR Phone required
        if (!email && !phone) {
            $(".contactform").find(".form-message").removeClass("d-none").addClass("d-block");
            $(".output_message").removeClass("success").html("Please provide either your Email or Mobile No.");
            return false;
        }

        const btn = $(this).find('button[type="submit"]');
        const originalText = btn.html();
        btn.html("<span>Sending...</span>").prop("disabled", true);
        
        const payload = {
            name: name,
            email: email || "N/A",
            phone: phone || "N/A",
            subject: subject || "No Subject",
            message: message || "",
            stage: "Draft",
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch('https://amul-portfolio-default-rtdb.firebaseio.com/messages.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if(!response.ok) throw new Error("Firebase error (Check Security Rules)");

            // Show Popup
            alert("Thanks " + name + "! Your message has been sent successfully.");
            
            // Clear Form
            $(".formcontact")[0].reset();
            $(".contactform").find(".form-message").removeClass("d-block").addClass("d-none");
            
        } catch(error) {
            console.error(error);
            $(".contactform").find(".form-message").removeClass("d-none").addClass("d-block");
            $(".output_message").removeClass("success").html("Error: Message couldn't be sent. Check Firebase Rules.");
        } finally {
            btn.html(originalText).prop("disabled", false);
        }
        return false;
    });

    $(window).on("load", function() {
        $("body").addClass("loaded");
        
        if ($("body").hasClass("index")) {
            // Initial Section and Overflow handling
            var hash = window.location.hash;
            var links = [...document.querySelectorAll('.link-page')];
            var pages = links.map(a => a.getAttribute("href"));

            if (hash && pages.includes(hash)) {
                // Hide all and show the hash specific sections
                pages.forEach(a => {
                    const el = document.querySelector(a);
                    if (el) el.style.display = 'none';
                });
                const activeSection = document.querySelector(hash);
                if (activeSection) activeSection.style.display = 'block';

                // Update navigation active state
                $('#main-navigation li a').removeClass('active');
                $('#main-navigation li a[href="' + hash + '"]').addClass('active');

                if (hash === "" || hash === "#home") {
                    $('#wrapper').css('overflow', 'hidden');
                    $( ".simplebar-content-wrapper" ).css('overflow', 'hidden');
                } else {
                    $('#wrapper').css('overflow', 'auto');
                    $( ".simplebar-content-wrapper" ).css('overflow', 'auto');
                }
            } else {
                // Default to Home visibility
                pages.forEach(a => {
                    const el = document.querySelector(a);
                    if (el && a !== "#home") el.style.display = 'none';
                });
                const homeSec = document.querySelector("#home");
                if (homeSec) homeSec.style.display = 'block';

                $('#wrapper').css('overflow', 'hidden');
                $( ".simplebar-content-wrapper" ).css('overflow', 'hidden');
            }
        }
    });


    $(window).on('resize',function(){

        /* ----------------------------------------------------------- */
        /*  RE-INITIALIZE OWL CAROUSEL ON RESIZE
        /* ----------------------------------------------------------- */

        if ($("body").hasClass("index")) {
            /* OwlCarousel Removed */
        }

    });

});