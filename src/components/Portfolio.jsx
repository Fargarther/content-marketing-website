// Portfolio section listing projects
const projects = [
  {
    title: 'Content Strategy for TechStart',
    description: 'Developed comprehensive content strategy that increased organic traffic by 150% in 6 months.',
    link: '#',
    icon: '📝'
  },
  {
    title: 'Green Living Blog',
    description: 'Created and managed sustainable lifestyle blog with 50K+ monthly readers.',
    link: '#',
    icon: '📊'
  },
  {
    title: 'StartupHub Campaign',
    description: 'Led social media campaign that generated 10K+ leads for B2B SaaS platform.',
    link: '#',
    icon: '🚀'
  }
];

const Portfolio = () => (
  <section id="portfolio" className="portfolio">
    <h2>Selected Work</h2>
    <div className="portfolio-grid">
      {projects.map((proj, idx) => (
        <div className="portfolio-card" key={idx}>
          <div className="portfolio-image">{proj.icon}</div>
          <div className="portfolio-content">
            <h3>{proj.title}</h3>
            <p>{proj.description}</p>
            <a href={proj.link} target="_blank" rel="noopener noreferrer" className="portfolio-link">
              View Project →
            </a>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Portfolio;