import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

function Projects() {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClientName, setNewClientName] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({
    clientId: '',
    projectName: '',
    description: '',
    dueDate: ''
  });
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchClients();
    fetchProjects();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      await axios.post('/api/clients', {
        clientName: newClientName
      });
      setNewClientName('');
      setShowClientForm(false);
      fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure? This will delete the client and all associated projects.')) {
      return;
    }

    try {
      await axios.delete(`/api/clients/${clientId}`);
      fetchClients();
      fetchProjects();
      if (selectedClient === clientId) {
        setSelectedClient(null);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.projectName.trim() || !newProject.clientId || !newProject.dueDate) {
      alert('Please fill in client, project name, and due date');
      return;
    }

    try {
      await axios.post('/api/projects', {
        clientId: newProject.clientId,
        projectName: newProject.projectName,
        description: newProject.description,
        dueDate: newProject.dueDate
      });
      setNewProject({
        clientId: '',
        projectName: '',
        description: '',
        dueDate: ''
      });
      setShowProjectForm(false);
      fetchProjects();
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const handleToggleProjectComplete = async (projectId, currentStatus) => {
    try {
      await axios.patch(`/api/projects/${projectId}`, {
        completed: !currentStatus
      });
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleUpdateProject = async (projectId, updates) => {
    try {
      await axios.patch(`/api/projects/${projectId}`, updates);
      setEditingProject(null);
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await axios.delete(`/api/projects/${projectId}`);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const getProjectsByClient = (clientId) => {
    return projects.filter(p => p.client_id === clientId);
  };

  const isOverdue = (dueDate) => {
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  const isDueToday = (dueDate) => {
    const today = new Date().toISOString().split('T')[0];
    return dueDate === today;
  };

  const filteredProjects = selectedClient
    ? projects.filter(p => p.client_id === selectedClient)
    : projects;

  return (
    <div className="projects-container">
      <div className="projects-layout">
        {/* Clients Sidebar */}
        <div className="clients-sidebar">
          <div className="section-header">
            <h2>Clients</h2>
            <button
              className="btn btn-small btn-primary"
              onClick={() => setShowClientForm(!showClientForm)}
            >
              + Add Client
            </button>
          </div>

          {showClientForm && (
            <form onSubmit={handleAddClient} className="add-form" style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Client name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="input"
                autoFocus
              />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Add</button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowClientForm(false);
                    setNewClientName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="client-list">
            <button
              className={`client-item ${selectedClient === null ? 'active' : ''}`}
              onClick={() => setSelectedClient(null)}
            >
              <span>All Clients</span>
              <span className="client-count">{projects.length}</span>
            </button>
            {clients.map(client => {
              const clientProjects = getProjectsByClient(client.id);
              return (
                <div key={client.id} className="client-item-wrapper">
                  <button
                    className={`client-item ${selectedClient === client.id ? 'active' : ''}`}
                    onClick={() => setSelectedClient(client.id)}
                  >
                    <span>{client.client_name}</span>
                    <span className="client-count">{clientProjects.length}</span>
                  </button>
                  <button
                    className="btn-delete-client"
                    onClick={() => handleDeleteClient(client.id)}
                    title="Delete client"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projects Main Area */}
        <div className="projects-main">
          <div className="section-header">
            <h2>
              {selectedClient
                ? `Projects - ${clients.find(c => c.id === selectedClient)?.client_name}`
                : 'All Projects'}
            </h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowProjectForm(!showProjectForm)}
            >
              + Add Project
            </button>
          </div>

          {showProjectForm && (
            <form onSubmit={handleAddProject} className="add-form project-form">
              <select
                value={newProject.clientId}
                onChange={(e) => setNewProject({ ...newProject, clientId: e.target.value })}
                className="input"
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.client_name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Project name"
                value={newProject.projectName}
                onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                className="input"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="input"
                rows="2"
              />
              <input
                type="date"
                value={newProject.dueDate}
                onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                className="input"
                required
              />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Add Project</button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowProjectForm(false);
                    setNewProject({
                      clientId: '',
                      projectName: '',
                      description: '',
                      dueDate: ''
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="projects-list">
            {filteredProjects.length === 0 ? (
              <div className="empty-state">
                <p>No projects yet. Add one to get started!</p>
              </div>
            ) : (
              filteredProjects.map(project => (
                <div
                  key={project.id}
                  className={`project-card ${project.completed ? 'completed' : ''} ${
                    !project.completed && isOverdue(project.due_date) ? 'overdue' : ''
                  } ${!project.completed && isDueToday(project.due_date) ? 'due-today' : ''}`}
                >
                  <div className="project-header">
                    <div className="project-checkbox">
                      <input
                        type="checkbox"
                        checked={project.completed}
                        onChange={() => handleToggleProjectComplete(project.id, project.completed)}
                      />
                    </div>
                    <div className="project-info">
                      {editingProject === project.id ? (
                        <input
                          type="text"
                          value={project.project_name}
                          onChange={(e) => {
                            const updatedProjects = projects.map(p =>
                              p.id === project.id ? { ...p, project_name: e.target.value } : p
                            );
                            setProjects(updatedProjects);
                          }}
                          className="input"
                          autoFocus
                        />
                      ) : (
                        <h3>{project.project_name}</h3>
                      )}
                      <div className="project-meta">
                        <span className="client-badge">{project.client_name}</span>
                        <span className={`due-date ${
                          !project.completed && isOverdue(project.due_date) ? 'overdue' : ''
                        } ${!project.completed && isDueToday(project.due_date) ? 'due-today' : ''}`}>
                          {isOverdue(project.due_date) && !project.completed && '⚠️ '}
                          {isDueToday(project.due_date) && !project.completed && '📅 '}
                          Due: {new Date(project.due_date + 'T00:00:00').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="project-actions">
                      {editingProject === project.id ? (
                        <>
                          <button
                            className="btn btn-small btn-primary"
                            onClick={() => handleUpdateProject(project.id, { projectName: project.project_name })}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={() => {
                              setEditingProject(null);
                              fetchProjects();
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={() => setEditingProject(project.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <div className="project-description">
                      <p>{project.description}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Projects;
