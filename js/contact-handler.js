document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.querySelector('.formcontact');

    if (contactForm) {
        // --- EMAILJS CONFIGURATION ---
        // 1. SIGN UP at https://www.emailjs.com/
        // 2. CONNECT your Gmail (amulbabariya121@gmail.com)
        // 3. GET your PUBLIC KEY, SERVICE ID, and TEMPLATE ID

        const PUBLIC_KEY = "OoUEeHrrlo5D8f3GJ"; // Replace with your Public Key
        const SERVICE_ID = "service_i2d53zj"; // Replace with your Service ID
        const TEMPLATE_ID = "template_w5m66p6"; // Replace with your Template ID

        // Initialize EmailJS
        if (typeof emailjs !== 'undefined') {
            emailjs.init(PUBLIC_KEY);
        }

        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const msgOutput = document.querySelector('.output_message');
            const msgContainer = document.querySelector('.form-message');

            // Get Form Data
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const phone = document.getElementById('contact-phone').value;
            const subject = document.getElementById('contact-subject').value;
            const message = contactForm.querySelector('textarea[name="message"]').value;

            // Show Loading
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = btn.innerHTML;
            btn.innerHTML = '<span>Sending...</span>';
            btn.disabled = true;

            try {
                // 1. Save to Firebase (for Admin Panel)
                const firebaseInquiry = {
                    name,
                    email,
                    phone,
                    subject,
                    message,
                    timestamp: new Date().toISOString(),
                    stage: "Draft"
                };

                await fetch('https://amul-portfolio-default-rtdb.firebaseio.com/messages.json', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(firebaseInquiry)
                });

                // 2. Send Email via EmailJS
                // Design parameters for your EmailJS Template:
                // {{from_name}}, {{from_email}}, {{from_phone}}, {{subject}}, {{message}}

                const templateParams = {
                    from_name: name,
                    from_email: email,
                    from_phone: phone,
                    subject: subject,
                    message: message,
                    to_email: 'amulbabariya07@gmail.com'
                };

                emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
                    .then(function (response) {
                        msgContainer.classList.remove('d-none');
                        msgContainer.classList.add('text-success');
                        msgOutput.innerText = "Success! Message sent and saved to Dashboard.";
                        contactForm.reset();
                    }, function (error) {
                        throw new Error(error.text || "EmailJS failed to send");
                    })
                    .catch(err => {
                        console.error(err);
                        msgContainer.classList.remove('d-none');
                        msgContainer.classList.add('text-danger');
                        msgOutput.innerText = "Error: " + err;
                    });

            } catch (error) {
                console.error(error);
                msgContainer.classList.remove('d-none');
                msgContainer.classList.add('text-danger');
                msgOutput.innerText = "System Error: " + error.message;
            } finally {
                btn.innerHTML = originalBtnText;
                btn.disabled = false;
            }
        });
    }
});
