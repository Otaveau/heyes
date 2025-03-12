import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2, Plus, Loader2, Save, X } from 'lucide-react';
import { fetchOwners, deleteOwner, createOwner, updateOwner } from '../../services/api/ownerService';
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
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedOwner, setEditedOwner] = useState({ name: '', email: '', teamId: '' });

  // Utiliser useRef pour surveiller les changements de selectedOwner
  const previousSelectedOwner = useRef(null);
    
  useEffect(() => {
    // Afficher les détails du propriétaire sélectionné dans la console
    if (selectedOwner && selectedOwner !== previousSelectedOwner.current) {
      previousSelectedOwner.current = selectedOwner;
    }
  }, [selectedOwner]);

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
        name: newOwner.name.trim(),
        email: newOwner.email.trim(),
        teamId: newOwner.teamId ? parseInt(newOwner.teamId, 10) : null
      };

      // Utilisation du service createOwner
      await createOwner(sanitizedOwner);

      setNewOwner({ name: '', email: '', teamId: '' });
 
      await loadOwners();
    } catch (error) {
      console.error('Error creating owner:', error);
      
      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la création du propriétaire. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (owner, e) => {
    e.stopPropagation();
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
      // Obtenir l'ID correct pour la suppression
      const ownerId = ownerToDelete.id || ownerToDelete.owner_id || ownerToDelete.ownerId;
      
      // Utilisation du service deleteOwner
      await deleteOwner(ownerId);
      
      // Si le propriétaire supprimé était sélectionné, désélectionner
      if (selectedOwner && (selectedOwner.id === ownerId || selectedOwner.owner_id === ownerId || selectedOwner.ownerId === ownerId)) {
        setSelectedOwner(null);
        setEditMode(false);
      }
      
      await loadOwners();
    } catch (error) {
      console.error('Error deleting owner:', error);
      
      if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la suppression du propriétaire. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
      closeDeleteModal();
    }
  };

  const handleOwnerSelect = (owner) => {
    // Vérifier si l'ID de l'owner est le même que celui de l'owner sélectionné
    const ownerId = owner.id || owner.owner_id || owner.ownerId;
    const selectedId = selectedOwner?.id || selectedOwner?.owner_id || selectedOwner?.ownerId;
    
    if (selectedOwner && ownerId === selectedId) {
      setSelectedOwner(null);
      setEditMode(false);
    } else {
      // Normaliser l'objet owner pour assurer la compatibilité avec l'UI
      const normalizedOwner = {
        ...owner,
        // Assurer que les propriétés requises sont présentes
        id: ownerId,
        teamId: owner.teamId || owner.team_id
      };
      
      setSelectedOwner(normalizedOwner);
      setEditedOwner({ 
        ...normalizedOwner,
        teamId: (owner.teamId || owner.team_id || '').toString()
      });
      setEditMode(false);
    }
  };

  const handleEditMode = (e) => {
    e.preventDefault();
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Remettre les valeurs originales
    setEditedOwner({ 
      ...selectedOwner,
      teamId: (selectedOwner.teamId || selectedOwner.team_id || '').toString()
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editedOwner.name.trim() || !editedOwner.email.trim() || !editedOwner.teamId) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Vérifier si l'email existe déjà et n'appartient pas à cet owner
      const ownerId = editedOwner.id || editedOwner.owner_id || editedOwner.ownerId;
      
      const existingOwner = owners.find(owner => {
        const ownerEmail = owner.email.toLowerCase();
        const editedEmail = editedOwner.email.toLowerCase();
        const currentOwnerId = owner.id || owner.owner_id || owner.ownerId;
        return ownerEmail === editedEmail && currentOwnerId !== ownerId;
      });
      
      if (existingOwner) {
        setError('Un autre propriétaire utilise déjà cet email');
        setIsSubmitting(false);
        return;
      }

      const sanitizedOwner = {
        name: editedOwner.name.trim(),
        email: editedOwner.email.trim(),
        teamId: editedOwner.teamId ? parseInt(editedOwner.teamId, 10) : null
      };
      
      const updatedOwner = await updateOwner(ownerId, sanitizedOwner);

      // Récupérer le nom de l'équipe pour l'ajouter aux informations du propriétaire
      const teamId = updatedOwner.teamId || updatedOwner.team_id;
      const teamName = getTeamNameById(teamId);
      
      // Normaliser les propriétés pour être cohérent dans l'UI
      const normalizedOwner = {
        ...updatedOwner,
        id: updatedOwner.id || updatedOwner.owner_id,
        ownerId: updatedOwner.owner_id,
        teamId: teamId,
        teamName: teamName
      };

      // Mettre à jour le propriétaire sélectionné
      setSelectedOwner(normalizedOwner);
      
      // Sortir du mode édition
      setEditMode(false);
      
      // Recharger la liste des propriétaires
      await loadOwners();
    } catch (error) {
      console.error('Error updating owner:', error);
      
      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la mise à jour du propriétaire. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTeamNameById = (teamId) => {
    if (!teamId) return 'N/A';
    
    // Convertir en nombre si c'est une chaîne
    const parsedTeamId = typeof teamId === 'string' ? parseInt(teamId, 10) : teamId;
    
    const team = teams.find(t => {
      // Vérifier à la fois team_id et id
      const currentTeamId = t.team_id !== undefined ? t.team_id : t.id;
      return currentTeamId === parsedTeamId;
    });
    
    return team ? team.name : 'N/A';
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Gestion des propriétaires</h2>

      {/* Formulaire d'ajout de propriétaire */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid gap-4 md:grid-cols-3">
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
            <option key="default-new" value="">Sélectionner une équipe</option>
            {teams.map(team => (
              <option key={`new-${team.team_id || team.id}`} value={team.team_id || team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4">
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
        </div>
      </form>

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
        {/* Liste des propriétaires */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Liste des propriétaires</h3>
          
          {isLoading && !isSubmitting ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : owners.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Aucun propriétaire disponible. Créez votre premier propriétaire.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1">
              {owners.map(owner => {
                const ownerId = owner.id || owner.owner_id || owner.ownerId;
                const selectedId = selectedOwner?.id || selectedOwner?.owner_id || selectedOwner?.ownerId;
                
                return (
                  <Card 
                    key={ownerId} 
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedOwner && ownerId === selectedId 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleOwnerSelect(owner)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{owner.name}</h3>
                        <p className="text-sm text-gray-600">{owner.email}</p>
                        <p className="text-sm text-gray-600">Équipe: {owner.teamName || getTeamNameById(owner.teamId || owner.team_id)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => openDeleteModal(owner, e)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Détails du propriétaire sélectionné */}
        {selectedOwner && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Détails du propriétaire</h3>
            <Card className="p-6">
              {editMode ? (
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div>
                    <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <Input
                      id="ownerName"
                      type="text"
                      value={editedOwner.name}
                      onChange={(e) => setEditedOwner({ ...editedOwner, name: e.target.value })}
                      placeholder="Nom"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="ownerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={editedOwner.email}
                      onChange={(e) => setEditedOwner({ ...editedOwner, email: e.target.value })}
                      placeholder="Email"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="ownerTeam" className="block text-sm font-medium text-gray-700 mb-1">
                      Équipe
                    </label>
                    <select
                      id="ownerTeam"
                      value={editedOwner.teamId}
                      onChange={(e) => setEditedOwner({ ...editedOwner, teamId: e.target.value })}
                      className="border rounded p-2 w-full"
                      required
                      disabled={isSubmitting}
                    >
                      <option key="default-edit" value="">Sélectionner une équipe</option>
                      {teams.map(team => (
                        <option key={`edit-${team.team_id || team.id}`} value={team.team_id || team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !editedOwner.name.trim() || !editedOwner.email.trim() || !editedOwner.teamId}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Nom</p>
                    <p className="font-medium">{selectedOwner.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedOwner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Équipe</p>
                    <p className="font-medium">{selectedOwner.teamName || getTeamNameById(selectedOwner.teamId || selectedOwner.team_id)}</p>
                  </div>
                  <div className="pt-2">
                    <Button onClick={handleEditMode}>
                      Modifier
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

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