// Contact section with email and social links
const Contact = () => (
  <section id="contact" className="contact">
    <div className="contact-content">
      <h2>Let's Connect</h2>
      <p>
        I'm always excited to discuss new projects, creative ideas, or opportunities to be part of your visions.
        Whether you need content strategy, want to collaborate, or just want to say hello, I'd love to hear from you.
      </p>
      <div className="contact-links">
        <a href="mailto:alex@example.com" className="contact-link">
          📧 Email Me
        </a>
        <a href="https://linkedin.com/in/alexbenson" target="_blank" rel="noopener noreferrer" className="contact-link">
          💼 LinkedIn
        </a>
        <a href="https://twitter.com/alexbenson" target="_blank" rel="noopener noreferrer" className="contact-link">
          🐦 Twitter
        </a>
      </div>
    </div>
  </section>
);

export default Contact;