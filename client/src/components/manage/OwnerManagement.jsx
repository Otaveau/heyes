import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { fetchOwners, deleteOwner, createOwner } from '../../services/api/ownerService';
import { fetchTeams } from '../../services/api/teamService';
import ConfirmationModal from '../common/ConfirmationModal';

export const OwnerManagement = () => {
  const [owners, setOwners] = useState([]);
  const [newOwner, setNewOwner] = useState({
    name: '',
    email: '',
    teamId: ''
  });
  const [teams, setTeams] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadOwners = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchOwners();
      setOwners(data);
    } catch (error) {
      console.error('Error fetching owners:', error);
      setError('Impossible de charger les propriétaires. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Impossible de charger les équipes. Veuillez réessayer plus tard.');
    }
  };

  useEffect(() => {
    loadOwners();
    loadTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newOwner.name.trim() || !newOwner.email.trim() || !newOwner.teamId) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Vérification si l'email existe déjà
      const existingOwner = owners.find(owner => owner.email.toLowerCase() === newOwner.email.toLowerCase());
      if (existingOwner) {
        setError('Un propriétaire avec cet email existe déjà');
        setIsSubmitting(false);
        return;
      }

      const sanitizedOwner = {
        ...newOwner,
        name: newOwner.name.trim(),
        email: newOwner.email.trim(),
        teamId: newOwner.teamId ? parseInt(newOwner.teamId, 10) : null
      };

      // Si vous avez un service createOwner, utilisez-le ici
      const token = localStorage.getItem('token');
      const response = await fetch('/api/owners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sanitizedOwner),
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        await loadOwners();
        setNewOwner({ name: '', email: '', teamId: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.message || 'Erreur lors de la création du propriétaire');
      }
    } catch (error) {
      console.error('Error creating owner:', error);
      setError('Erreur lors de la création du propriétaire. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (owner) => {
    setOwnerToDelete(owner);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setOwnerToDelete(null);
  };

  const confirmDelete = async () => {
    if (!ownerToDelete) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Si vous avez un service deleteOwner, utilisez-le ici
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/owners/${ownerToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        await loadOwners();
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting owner:', error);
      setError('Erreur lors de la suppression du propriétaire. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Gestion des propriétaires</h2>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input
            type="text"
            value={newOwner.name}
            onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })}
            placeholder="Nom"
            required
            disabled={isSubmitting}
          />
          <Input
            type="email"
            value={newOwner.email}
            onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
            placeholder="Email"
            required
            disabled={isSubmitting}
          />
          <select
            value={newOwner.teamId}
            onChange={(e) => setNewOwner({ ...newOwner, teamId: e.target.value })}
            className="border rounded p-2"
            required
            disabled={isSubmitting}
          >
            <option key="default" value="">Sélectionner une équipe</option>
            {teams.map(team => (
              <option key={team.team_id || team.id} value={team.team_id || team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <Button 
          type="submit" 
          disabled={isSubmitting || !newOwner.name.trim() || !newOwner.email.trim() || !newOwner.teamId}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ajout...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </>
          )}
        </Button>
        {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
      </form>

      {isLoading && !isSubmitting ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : owners.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Aucun propriétaire disponible. Créez votre premier propriétaire.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {owners.map(owner => (
            <Card key={owner.id} className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{owner.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteModal(owner)}
                    className="text-red-500 hover:text-red-700"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">{owner.email}</p>
                <p className="text-sm text-gray-600">Équipe: {owner.teamName || 'N/A'}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le propriétaire "${ownerToDelete?.name}" ?`}
      />
    </div>
  );
};