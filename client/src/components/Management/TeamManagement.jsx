import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2 } from 'lucide-react';
import { fetchTeams} from '../../services/api/teamService';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState({ name: '' });
  const loadTeams = async () => {
    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token'); // Récupérez le token stocké

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Ajoutez le token
        },
        body: JSON.stringify(newTeam),
      });

      if (response.status === 401) {
        // Redirect to login page
        window.location.href = '/login';
        return;
      }
      if (response.ok) {
        fetchTeams();
        setNewTeam({ name: '' });
      } else {
        // Gérer les erreurs
        const errorData = await response.json();
        console.error('Error:', errorData);
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleDelete = async (teamId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchTeams();
      }
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Gestion des équipes</h2>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <Input
            type="text"
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            placeholder="Nom de l'équipe"
            className="w-full max-w-sm"
            required
          />
          <Button type="submit">Ajouter</Button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map(team => (
          <Card key={team.id} className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold">{team.name}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(team.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default TeamManagement;