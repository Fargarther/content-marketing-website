// Portfolio section listing sample projects
const projects = [
  {
    title: 'Project One',
    description: 'Brief description of project one.',
    link: '#'
  },
  {
    title: 'Project Two',
    description: 'Brief description of project two.',
    link: '#'
  },
  {
    title: 'Project Three',
    description: 'Brief description of project three.',
    link: '#'
  }
];

const Portfolio = () => (
  <section id="portfolio" className="portfolio">
    <h2>Portfolio</h2>
    <div className="portfolio-grid">
      {projects.map((proj, idx) => (
        <div className="portfolio-card" key={idx}>
          <h3>{proj.title}</h3>
          <p>{proj.description}</p>
          <a href={proj.link} target="_blank" rel="noopener noreferrer">
            View project
          </a>
        </div>
      ))}
    </div>
  </section>
);

export default Portfolio;
