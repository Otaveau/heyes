#!/bin/bash

# Arrêter le script en cas d'erreur
set -e

# Message de début
echo "Starting Vercel build process..."

# Créer les répertoires de build si nécessaire
mkdir -p build

# Build du client
echo "Building client..."
cd client
npm install

# Utilisez npx pour exécuter react-scripts
CI="" npx react-scripts build

cd ..

# Build du serveur
echo "Preparing server..."
cd server
npm install
cd ..

# Copier les fichiers de build du client
echo "Copying client build files..."
cp -R client/build build/client

# Copier les fichiers du serveur
echo "Copying server files..."
mkdir -p build/server
cp -R server/src build/server/
cp server/package.json build/server/
cp server/package-lock.json build/server/

# Installer uniquement les dépendances de production pour le serveur
cd build/server
npm install --production
cd ../..

# Message de fin
echo "Vercel build process completed successfully!"