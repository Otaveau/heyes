import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2 } from 'lucide-react';
import { fetchOwners } from '../../services/api/ownerService';
import { fetchTeams} from '../../services/api/teamService';


const OwnerManagement = () => {
  const [owners, setOwners] = useState([]);
  const [newOwner, setNewOwner] = useState({
    name: '',
    email: '',
    teamId: ''
  });
  const [teams, setTeams] = useState([]);

  const loadOwners = async () => {
    try {
      const data = await fetchOwners();
      setOwners(data);
    } catch (error) {
      console.error('Error fetching owners:', error);
    }
  };

  const loadTeams = async () => {
    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  useEffect(() => {
    loadOwners();
    loadTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const existingOwner = owners.find(owner => owner.email === newOwner.email);
      if (existingOwner) {
        alert('Un propriétaire avec cet email existe déjà');
        return;
      }

      const sanitizedOwner = {
        ...newOwner,
        teamId: newOwner.teamId ? parseInt(newOwner.teamId, 10) : null
      };

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
        fetchOwners();
        setNewOwner({ name: '', email: '', teamId: '' });
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (error) {
      console.error('Error creating owner:', error);
    }
  };

  const handleDelete = async (ownerId) => {
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/owners/${ownerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        fetchOwners();
      } else {
        const errorData = await response.json();
        console.error('Error:', errorData);
      }
    } catch (error) {
      console.error('Error deleting owner:', error);
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
          />
          <Input
            type="email"
            value={newOwner.email}
            onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
            placeholder="Email"
            required
          />
          <select
            value={newOwner.teamId}
            onChange={(e) => setNewOwner({ ...newOwner, teamId: e.target.value })}
            className="border rounded p-2"
            required
          >
            <option key="default" value="">Sélectionner une équipe</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit">Ajouter</Button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {owners.map(owner => (
          <Card key={owner.id} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{owner.name}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(owner.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">{owner.email}</p>
              <p className="text-sm text-gray-600">Équipe: {owner.teamName}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OwnerManagement;