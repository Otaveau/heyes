const app = require('./app');

// Vercel utilise par défaut le port défini par l'environnement ou 3000
const port = process.env.PORT || 3000;

// En environnement de développement local, nous démarrons le serveur
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
  });
}

// Pour Vercel, nous exportons simplement l'app
module.exports = app;