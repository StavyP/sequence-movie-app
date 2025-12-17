import React, { useState, useEffect } from 'react';
// Importation des icônes
import { Plus, X, Search, SortAsc, SortDesc, LayoutGrid, List, BarChart, Upload, Download } from 'lucide-react'; 
import './App.css'; 

function App() {
  const getTodayDate = () => new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

  const initialNewMovieState = {
    title: '',
    poster: '',
    rating: 10,
    review: '',
    // --- VO est coché par défaut ---
    versions: { VF: false, VO: true }, 
    // ---------------------------------
    year: new Date().getFullYear(),
    duration: '', // Ex: "120 min"
    director: '',
    actors: '',
    genre: '', 
    platform: '',
    tags: [],
    watched: true,
    dateWatched: getTodayDate(),
  };
  
  const [movies, setMovies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [sortBy, setSortBy] = useState('dateWatched'); 
  const [sortDirection, setSortDirection] = useState('desc'); // État pour la direction de tri
  const [searchTerm, setSearchTerm] = useState('');
  const [newMovie, setNewMovie] = useState(initialNewMovieState);
  const [showStats, setShowStats] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterRating, setFilterRating] = useState('all');
  const [filterVersion, setFilterVersion] = useState('all');
  const [filterGenre, setFilterGenre] = useState('all');
  const [filterWatched, setFilterWatched] = useState('all');

  const predefinedTags = ['favori', 'revoir', 'decu', 'culte', 'oscar', 'surprise'];

  // Charger les données au démarrage
  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = () => {
    try {
      const data = localStorage.getItem('movies-list');
      if (data) {
        setMovies(JSON.parse(data));
      }
    } catch (error) {
      console.log('Aucune donnée sauvegardée trouvée');
    }
  };

  const saveMovies = (updatedMovies) => {
    try {
      localStorage.setItem('movies-list', JSON.stringify(updatedMovies));
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
    }
  };
  
  /**
   * Fonction pour exporter les données du localStorage vers un fichier JSON.
   */
  const handleExportMovies = () => {
    const data = localStorage.getItem('movies-list');
    if (!data || data === '[]') {
      alert("Aucune donnée à exporter.");
      return;
    }

    const filename = `sequence_export_${getTodayDate()}.json`;
    // Création d'un Blob pour le téléchargement
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Création d'un lien invisible pour déclencher le téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`Données exportées dans ${filename}!`);
  };

  /**
   * Fonction pour importer les données à partir d'un fichier JSON.
   */
  const handleImportMovies = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Vérification du type de fichier de base
    if (file.type !== "application/json" && !file.name.toLowerCase().endsWith('.json')) {
      alert("Veuillez sélectionner un fichier JSON valide.");
      // Réinitialiser le champ de fichier après l'erreur
      event.target.value = ''; 
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validation simple: doit être un tableau
        if (!Array.isArray(importedData)) {
            alert("Erreur: Le contenu du fichier JSON n'est pas un format de liste de films valide.");
            event.target.value = '';
            return;
        }

        const overwrite = window.confirm(
          `Êtes-vous sûr de vouloir IMPORTER ${importedData.length} films ?\nCeci va REMPLACER toutes vos données actuelles. Continuer ?`
        );

        if (overwrite) {
          // Mise à jour du state et du localStorage
          setMovies(importedData);
          saveMovies(importedData);
          alert(`Succès! ${importedData.length} films importés.`);
        }
        
      } catch (error) {
        console.error("Erreur lors de la lecture ou de l'analyse du fichier:", error);
        alert("Erreur lors de l'importation. Assurez-vous que le fichier est un JSON valide.");
      }
      // Toujours réinitialiser le champ de fichier pour permettre un nouvel import
      event.target.value = ''; 
    };
    reader.readAsText(file);
  };

  const addMovie = () => {
    if (!newMovie.title || !newMovie.poster) return;
    
    const movie = {
      id: Date.now(),
      ...newMovie, 
      dateAdded: new Date().toISOString()
    };
    
    const updatedMovies = [...movies, movie];
    setMovies(updatedMovies);
    saveMovies(updatedMovies);
    
    // Réinitialiser la date du jour pour l'état initial (prêt pour un nouvel ajout)
    setNewMovie({...initialNewMovieState, dateWatched: getTodayDate()}); 
    setShowAddModal(false);
  };

  const updateMovie = (id, updates) => {
    // Logique pour mettre à jour automatiquement la date de visionnage
    if (updates.watched === true && !updates.dateWatched) {
        // Le film passe à 'Vu' (true) -> On ajoute la date du jour si elle n'est pas déjà dans les updates.
        updates.dateWatched = getTodayDate();
    } else if (updates.watched === false) {
        // Le film passe à 'À voir' (false) -> On retire la date de visionnage.
        updates.dateWatched = null; // null pour l'objet movie (stockage)
    }
    
    const updatedMovies = movies.map(m => m.id === id ? { ...m, ...updates } : m);
    setMovies(updatedMovies);
    saveMovies(updatedMovies);
    
    // Si le film sélectionné est mis à jour, on met à jour l'état local du modal aussi
    if (selectedMovie && selectedMovie.id === id) {
        setSelectedMovie(prev => ({ ...prev, ...updates }));
    }
  };

  const deleteMovie = (id) => {
    const updatedMovies = movies.filter(m => m.id !== id);
    setMovies(updatedMovies);
    saveMovies(updatedMovies);
    setSelectedMovie(null);
  };

  const getRatingColor = (rating) => {
    if (rating >= 16) return 'rating-excellent';
    if (rating >= 12) return 'rating-good';
    if (rating >= 8) return 'rating-average';
    return 'rating-poor';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const date = new Date(datePart.replace(/-/g, '/')); // Correction pour la compatibilité
    if (isNaN(date)) return dateString;

    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    });
  };

  /**
   * Extrait la durée en minutes d'une chaîne (ex: "120 min")
   * @param {string} durationString 
   * @returns {number} Durée en minutes
   */
  const extractMinutes = (durationString) => {
    if (!durationString) return 0;
    const match = durationString.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  /**
   * Convertit une durée en minutes au format "XXh XXm" en ajoutant un zéro aux minutes si nécessaire
   * @param {string} durationString 
   * @returns {string} Durée formatée avec padding (ex: 1h05m)
   */
  const formatDuration = (durationString) => {
    const totalMinutes = extractMinutes(durationString);
    if (totalMinutes === 0) return 'N/A';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    let parts = [];
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    
    // Ajout du zéro en tête pour les minutes si elles sont supérieures à 0
    if (minutes > 0) {
      // Utilise padStart pour s'assurer d'avoir au moins deux chiffres (ex: 5 devient 05)
      const paddedMinutes = String(minutes).padStart(2, '0'); 
      parts.push(`${paddedMinutes}m`);
    }
    
    // Si la durée est inférieure à une heure, on affiche juste les minutes (ex: 45m)
    if (parts.length === 0 && totalMinutes > 0) {
         const paddedMinutes = String(totalMinutes).padStart(2, '0'); 
         return `${paddedMinutes}m`;
    }

    return parts.join('');
  };
  
  /**
   * Extrait tous les genres uniques en divisant les chaînes par virgule.
   * @returns {string[]} Liste des genres uniques.
   */
  const getAllGenres = () => {
    const genresSet = new Set();
    movies.forEach(movie => {
      if (movie.genre) {
        // Nettoyer et diviser la chaîne de genres par virgule
        const movieGenres = movie.genre
          .split(',')
          .map(g => g.trim())
          .filter(g => g.length > 0);
        
        movieGenres.forEach(g => genresSet.add(g));
      }
    });
    return Array.from(genresSet).sort();
  };
  
  const allGenres = getAllGenres();

  const getStats = () => {
    const total = movies.length;
    const watched = movies.filter(m => m.watched !== false).length;
    const avgRating = watched > 0 ? (movies.filter(m => m.watched !== false).reduce((sum, m) => sum + m.rating, 0) / watched).toFixed(1) : 0;
    
    const byRating = {
      excellent: movies.filter(m => m.watched !== false && m.rating >= 16).length,
      good: movies.filter(m => m.watched !== false && m.rating >= 12 && m.rating < 16).length,
      average: movies.filter(m => m.watched !== false && m.rating >= 8 && m.rating < 12).length,
      poor: movies.filter(m => m.watched !== false && m.rating < 8).length
    };
    
    // Pour les stats, on compte par genre individuel
    const genreCounts = {};
    movies.forEach(movie => {
      if (movie.genre) {
        movie.genre.split(',').map(g => g.trim()).filter(Boolean).forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }
    });
    const byGenre = Object.entries(genreCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const topMovies = [...movies].filter(m => m.watched !== false).sort((a, b) => b.rating - a.rating).slice(0, 5);
    
    return { total, watched, toWatch: total - watched, avgRating, byRating, byGenre, topMovies };
  };

  const toggleNewMovieTag = (tag) => {
    setNewMovie(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const toggleSelectedMovieTag = (tag) => {
    const newTags = selectedMovie.tags?.includes(tag)
      ? selectedMovie.tags.filter(t => t !== tag)
      : [...(selectedMovie.tags || []), tag];
    setSelectedMovie({...selectedMovie, tags: newTags});
    updateMovie(selectedMovie.id, {tags: newTags});
  };

  const getSortedMovies = () => {
    let filtered = movies.filter(m => {
      const matchSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.director?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.actors?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.review?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchRating = filterRating === 'all' || 
                          (filterRating === 'excellent' && m.rating >= 16) ||
                          (filterRating === 'good' && m.rating >= 12 && m.rating < 16) ||
                          (filterRating === 'average' && m.rating >= 8 && m.rating < 12) ||
                          (filterRating === 'poor' && m.rating < 8);
      
      const matchVersion = filterVersion === 'all' ||
                           (filterVersion === 'VF' && m.versions?.VF) ||
                           (filterVersion === 'VO' && m.versions?.VO);
      
      // LOGIQUE DE FILTRAGE PAR GENRE
      const matchGenre = filterGenre === 'all' || 
                         (m.genre && m.genre.split(',').map(g => g.trim()).includes(filterGenre));
      
      const matchWatched = filterWatched === 'all' ||
                           (filterWatched === 'watched' && m.watched !== false) ||
                           (filterWatched === 'toWatch' && m.watched === false);
      
      return matchSearch && matchRating && matchVersion && matchGenre && matchWatched;
    });

    const sortFn = (a, b) => {
      let comparison = 0;
      
      switch(sortBy) {
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'year':
          comparison = (b.year || 0) - (a.year || 0);
          break;
        case 'duration': // TRI PAR DURÉE
          comparison = extractMinutes(b.duration) - extractMinutes(a.duration);
          break;
        case 'dateWatched':
          // Correction pour utiliser la date de visionnage uniquement. 
          // Le || 0 garantit que les films "À voir" (dateWatched est null ou '') sont triés à la fin.
          const dateA = new Date(a.dateWatched || 0); 
          const dateB = new Date(b.dateWatched || 0);
          
          comparison = dateB.getTime() - dateA.getTime();
          
          // NOUVEAU: Si les dates sont identiques (même jour), trier par ID (ordre de saisie).
          if (comparison === 0) {
              comparison = b.id - a.id; 
          }
          break;
        case 'dateAdded': 
        default:
          const dateA_Add = new Date(a.dateAdded || 0);
          const dateB_Add = new Date(b.dateAdded || 0);
          comparison = dateB_Add.getTime() - dateA_Add.getTime();
          break;
      }

      // Appliquer la direction
      return sortDirection === 'desc' ? comparison : -comparison;
    };

    return filtered.sort(sortFn);
  };

  const sortedAndFilteredMovies = getSortedMovies();

  // --- Composants de rendu ---

  const TagsDisplay = ({ tags }) => (
    tags && tags.length > 0 && (
      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
        {tags.map(tag => (
          <span key={tag} className="tag-badge">
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </span>
        ))}
      </div>
    )
  );

const StatusButtons = ({ watched, onToggleWatched }) => {
    // Fonction qui inclut la nouvelle logique : si on passe à 'Vu', on ajoute la date du jour
    const handleToggle = (newWatchedState) => {
        let updates = { watched: newWatchedState };
        onToggleWatched(updates); 
    };

    return (
        <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Statut</label>
            <div className="version-buttons">
                {/* --- Bouton Vu --- */}
                <button
                    // Si on clique sur 'Vu' (true)
                    onClick={() => handleToggle(true)}
                    className={`btn-version ${watched !== false ? 'active btn-version-vf' : 'btn-version-vf'}`}
                    style={{ 
                      background: watched !== false ? '#2563eb' : '#2d3748',
                      border: watched !== false ? 'none' : '1px solid #4a5568'
                    }}
                >
                    ✅ Vu
                </button>
                {/* --- Bouton À voir --- */}
                <button
                    // Si on clique sur 'À voir' (false)
                    onClick={() => handleToggle(false)}
                    className={`btn-version ${watched === false ? 'active btn-version-vo' : 'btn-version-vo'}`}
                    style={{ 
                      background: watched === false ? '#7c3aed' : '#2d3748',
                      border: watched === false ? 'none' : '1px solid #4a5568'
                    }}
                >
                    📋 À voir
                </button>
            </div>
        </div>
    );
  };

  const MovieCard = ({ movie }) => (
    <div key={movie.id} className="movie-card" onClick={() => setSelectedMovie(movie)}>
      <img src={movie.poster} alt={movie.title} />
      <div className="movie-overlay">
        {movie.watched !== false && (
          <div className={`movie-rating ${getRatingColor(movie.rating)}`}>
            {movie.rating}/20
          </div>
        )}
        
        <div className="movie-info">
          <h3 className="movie-title">{movie.title}</h3>
          {movie.year && <p style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '4px' }}>({movie.year})</p>}
          
          {/* AFFICHAGE VERSIONS ET DURÉE AMÉLIORÉ */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <div className="movie-versions">
              {movie.versions?.VF && <span className="version-badge version-vf">VF</span>}
              {movie.versions?.VO && <span className="version-badge version-vo">VO</span>}
            </div>
            {movie.duration && (
                <span className="duration-badge"> {/* Utilisation de la nouvelle classe CSS pour la durée */}
                    {formatDuration(movie.duration)}
                </span>
            )}
          </div>
          {/* FIN DU BLOC */}

          <TagsDisplay tags={movie.tags} />
        </div>
      </div>
    </div>
  );

  const MovieListItem = ({ movie }) => (
    <div key={movie.id} className="movie-list-item" onClick={() => setSelectedMovie(movie)}>
      <img src={movie.poster} alt={movie.title} className="list-poster" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 className="movie-title" style={{ fontSize: '1rem', webkitLineClamp: '1' }}>
          {movie.title} 
          {movie.year && <span style={{ fontWeight: 'normal', color: '#9ca3af' }}> ({movie.year})</span>}
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '4px' }}>
          Vu le: {movie.watched !== false && movie.dateWatched ? formatDate(movie.dateWatched) : 'N/A'}
          {movie.duration && (
            <span style={{ marginLeft: '12px', color: '#6b7280' }}> | Durée: {formatDuration(movie.duration)}</span>
          )}
        </p>
        <TagsDisplay tags={movie.tags} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        {movie.watched !== false ? (
          <div className={`movie-rating ${getRatingColor(movie.rating)}`} style={{ position: 'static', padding: '4px 12px', boxShadow: 'none' }}>
            {movie.rating}/20
          </div>
        ) : (
          <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.875rem' }}>À voir</span>
        )}
        <div className="movie-versions" style={{ gap: '4px' }}>
          {movie.versions?.VF && <span className="version-badge version-vf">VF</span>}
          {movie.versions?.VO && <span className="version-badge version-vo">VO</span>}
        </div>
      </div>
    </div>
  );
  
  // --- Fonction dédiée pour gérer le statut dans le Modal d'Ajout ---
  const handleNewMovieStatusToggle = (updates) => {
    let newUpdates = updates;
    if (updates.watched === true) {
      // Si passe à Vu, ajouter la date du jour
      newUpdates = {...updates, dateWatched: getTodayDate()};
    } else if (updates.watched === false) {
      // Si passe à À voir, vider l'input date
      newUpdates = {...updates, dateWatched: ''}; 
    }
    setNewMovie(prev => ({...prev, ...newUpdates}));
  };
  // ------------------------------------------------------------------

  // --- RENDU PRINCIPAL ---

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <div className="header">
          <h1 className="title">Séquence</h1> {/* Nouveau nom */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setShowStats(!showStats)} className="btn btn-primary" title="Statistiques">
              <BarChart size={20} />
              Stats
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <Plus size={20} />
              Ajouter un film
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="controls">
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Rechercher un film, réalisateur, acteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {/* Filtres */}
          <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} className="sort-select" style={{ minWidth: '150px' }}>
            <option value="all">Toutes notes</option>
            <option value="excellent">⭐ Excellent (16+)</option>
            <option value="good">👍 Bien (12-15)</option>
            <option value="average">😐 Moyen (8-11)</option>
            <option value="poor">👎 Décevant (-8)</option>
          </select>

          <select value={filterVersion} onChange={(e) => setFilterVersion(e.target.value)} className="sort-select">
            <option value="all">Toutes versions</option>
            <option value="VF">VF</option>
            <option value="VO">VO</option>
          </select>

          {/* Filtre Genre basé sur tous les genres trouvés après split/trim */}
          {allGenres.length > 0 && (
            <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className="sort-select">
              <option value="all">Tous genres</option>
              {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          )}

          <select value={filterWatched} onChange={(e) => setFilterWatched(e.target.value)} className="sort-select">
            <option value="all">Tous les films</option>
            <option value="watched">✅ Vus</option>
            <option value="toWatch">📋 À voir</option>
          </select>
          
          {/* Tri avec Toggle de Direction */}
          <div className="sort-container">
            {/* Bouton pour inverser la direction du tri (Asc/Desc) */}
            <button 
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')} 
              className="btn-close" 
              title={sortDirection === 'asc' ? 'Tri descendant' : 'Tri ascendant'}
              style={{ padding: '0', background: 'transparent', border: 'none', color: '#9ca3af' }}
            >
              {sortDirection === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
            </button>
            
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select" style={{ border: 'none', background: 'transparent', height: 'auto' }}>
              <option value="dateWatched">Date vue</option>
              <option value="dateAdded">Date ajout</option>
              <option value="rating">Note</option>
              <option value="duration">Durée</option> {/* Nouvelle option */}
              <option value="title">Titre</option>
              <option value="year">Année</option>
            </select>
          </div>

          {/* Vue grille/liste */}
          <div className="sort-container" style={{ gap: '0', padding: '0' }}>
            <button 
              onClick={() => setViewMode('grid')} 
              className="btn-close"
              style={{ padding: '8px 12px', background: viewMode === 'grid' ? '#374151' : 'transparent', borderRadius: '8px 0 0 8px', color: viewMode === 'grid' ? 'white' : '#9ca3af' }}
              title="Vue grille"
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className="btn-close"
              style={{ padding: '8px 12px', background: viewMode === 'list' ? '#374151' : 'transparent', borderRadius: '0 8px 8px 0', color: viewMode === 'list' ? 'white' : '#9ca3af' }}
              title="Vue liste"
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        {showStats && (
          <div style={{ background: '#1f2937', borderRadius: '16px', padding: '24px', marginBottom: '32px', border: '1px solid #374151' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px' }}>📊 Statistiques & Gestion des données</h2>
            
            {/* BLOC IMPORT/EXPORT */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {/* Export Button */}
                <button onClick={handleExportMovies} className="btn btn-primary" style={{ background: '#22c55e', flexGrow: 1 }}>
                    <Download size={20} />
                    Exporter les données (.json)
                </button>
                
                {/* Import Button with hidden input */}
                <label htmlFor="import-file" className="btn btn-primary" style={{ background: '#3b82f6', cursor: 'pointer', flexGrow: 1 }}>
                    <Upload size={20} />
                    Importer des données (.json)
                </label>
                <input 
                    type="file" 
                    id="import-file" 
                    accept="application/json" 
                    onChange={handleImportMovies} 
                    style={{ display: 'none' }} 
                />
            </div>
            
            {/* Début de la grille des statistiques existantes */}
            {(() => {
              const stats = getStats();
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ background: '#111827', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Total de films</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</p>
                  </div>
                  <div style={{ background: '#111827', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Note moyenne</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.avgRating}/20</p>
                  </div>
                  <div style={{ background: '#111827', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Films vus</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.watched}</p>
                  </div>
                  <div style={{ background: '#111827', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>À voir</p>
                    <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.toWatch}</p>
                  </div>

                  <div style={{ background: '#111827', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '8px' }}>Répartition par note (Vus)</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
                      <div className="rating-excellent" style={{ background: 'none' }}>⭐ Excellent (16+): {stats.byRating.excellent}</div>
                      <div className="rating-good" style={{ background: 'none' }}>👍 Bien (12-15): {stats.byRating.good}</div>
                      <div className="rating-average" style={{ background: 'none' }}>😐 Moyen (8-11): {stats.byRating.average}</div>
                      <div className="rating-poor" style={{ background: 'none' }}>👎 Décevant (-8): {stats.byRating.poor}</div>
                    </div>
                  </div>
                  
                  {stats.byGenre.length > 0 && (
                    <div style={{ background: '#111827', padding: '16px', borderRadius: '8px', gridColumn: 'span 1' }}>
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '8px' }}>Genres principaux</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.875rem' }}>
                        {stats.byGenre.slice(0, 5).map(g => (
                          <div key={g.name}>{g.name} ({g.count})</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.topMovies.length > 0 && (
                    <div style={{ background: '#111827', padding: '16px', borderRadius: '8px', gridColumn: 'span 2' }}>
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '8px' }}>🏆 Top 5 des mieux notés</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                        {stats.topMovies.map((m, i) => (
                          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{i + 1}. **{m.title}**</span>
                            <span className={getRatingColor(m.rating)} style={{ padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem' }}>{m.rating}/20</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Liste de films */}
        {sortedAndFilteredMovies.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">Aucun film trouvé</p>
            <p className="empty-state-text">Modifiez vos filtres ou votre recherche.</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Vue Grille */
          <div className="movies-grid">
            {sortedAndFilteredMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          /* Vue Liste */
          <div className="movies-list">
            {sortedAndFilteredMovies.map(movie => (
              <MovieListItem key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>

      {/* Modal Add */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Ajouter un film</h2>
              <button onClick={() => setShowAddModal(false)} className="btn-close">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              
              <input
                type="text"
                placeholder="Titre du film"
                value={newMovie.title}
                onChange={(e) => setNewMovie({...newMovie, title: e.target.value})}
                className="form-input"
              />
              <input
                type="text"
                placeholder="URL de l'affiche (obligatoire)"
                value={newMovie.poster}
                onChange={(e) => setNewMovie({...newMovie, poster: e.target.value})}
                className="form-input"
              />

              {/* Utilisation de la nouvelle fonction handleNewMovieStatusToggle pour mettre à jour la date */}
              <StatusButtons 
                watched={newMovie.watched} 
                onToggleWatched={handleNewMovieStatusToggle} 
              />
              
              <div className="form-group">
                <label className="form-label">Date de visionnage</label>
                <input
                  type="date"
                  // Value sera une chaîne vide si on est en mode "À voir", ce qui vide l'input
                  value={newMovie.dateWatched} 
                  onChange={(e) => setNewMovie({...newMovie, dateWatched: e.target.value})}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input
                  type="number"
                  placeholder="Année (ex: 2024)"
                  value={newMovie.year}
                  onChange={(e) => setNewMovie({...newMovie, year: parseInt(e.target.value) || ''})}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Durée (ex: 120 min)"
                  value={newMovie.duration}
                  onChange={(e) => setNewMovie({...newMovie, duration: e.target.value})}
                  className="form-input"
                />
              </div>

              <input
                type="text"
                placeholder="Genre(s) (séparés par une virgule : Action, SF)"
                value={newMovie.genre}
                onChange={(e) => setNewMovie({...newMovie, genre: e.target.value})}
                className="form-input"
              />

              <input
                type="text"
                placeholder="Réalisateur"
                value={newMovie.director}
                onChange={(e) => setNewMovie({...newMovie, director: e.target.value})}
                className="form-input"
              />

              <input
                type="text"
                placeholder="Acteurs principaux"
                value={newMovie.actors}
                onChange={(e) => setNewMovie({...newMovie, actors: e.target.value})}
                className="form-input"
              />

              <input
                type="text"
                placeholder="Plateforme (Netflix, Cinéma...)"
                value={newMovie.platform}
                onChange={(e) => setNewMovie({...newMovie, platform: e.target.value})}
                className="form-input"
              />

              <div className="form-group">
                <label className="form-label">Note : {newMovie.rating}/20</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={newMovie.rating}
                  onChange={(e) => setNewMovie({...newMovie, rating: parseInt(e.target.value)})}
                  className="form-range"
                />
                <div className={`rating-display ${getRatingColor(newMovie.rating)}`}>
                  {newMovie.rating}/20
                </div>
              </div>

              <label className="form-label">Versions disponibles</label>
              <div className="version-buttons">
                <button
                  onClick={() => setNewMovie({...newMovie, versions: {...newMovie.versions, VF: !newMovie.versions.VF}})}
                  className={`btn-version ${newMovie.versions.VF ? 'active btn-version-vf' : ''}`}
                >
                  VF
                </button>
                <button
                  onClick={() => setNewMovie({...newMovie, versions: {...newMovie.versions, VO: !newMovie.versions.VO}})}
                  className={`btn-version ${newMovie.versions.VO ? 'active btn-version-vo' : ''}`}
                >
                  VO
                </button>
              </div>

              <label className="form-label">Tags (cliquer pour ajouter)</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {predefinedTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleNewMovieTag(tag)}
                    className={`tag-badge ${newMovie.tags.includes(tag) ? 'active' : ''}`}
                    style={{ background: newMovie.tags.includes(tag) ? '#a78bfa' : '#374151', cursor: 'pointer', border: 'none' }}
                  >
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Votre avis (optionnel)"
                value={newMovie.review}
                onChange={(e) => setNewMovie({...newMovie, review: e.target.value})}
                className="form-textarea"
              />
              <button onClick={addMovie} className="btn-add">
                Ajouter le film
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {selectedMovie && (
        <div className="modal-backdrop" onClick={() => setSelectedMovie(null)}>
          <div className="modal modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <img src={selectedMovie.poster} alt={selectedMovie.title} className="modal-poster" />
              <div className="modal-info">
                <div className="modal-header">
                  <h2 className="modal-title">{selectedMovie.title}</h2>
                  <button onClick={() => setSelectedMovie(null)} className="btn-close">
                    <X size={24} />
                  </button>
                </div>

                {/* StatusButtons gère la mise à jour pour le film sélectionné, updateMovie gère l'effacement/ajout de la date */}
                <StatusButtons 
                  watched={selectedMovie.watched} 
                  onToggleWatched={(updates) => updateMovie(selectedMovie.id, updates)}
                />
                
                <div className="form-group">
                  <label className="form-label">Date de visionnage</label>
                  <input
                    type="date"
                    // Si dateWatched est null, la valeur devient '', ce qui vide l'input.
                    value={selectedMovie.dateWatched?.split('T')[0] || ''} 
                    onChange={(e) => {
                      setSelectedMovie({...selectedMovie, dateWatched: e.target.value});
                      // Le fait de fournir une date manuellement empêche updateMovie de la modifier.
                      updateMovie(selectedMovie.id, {dateWatched: e.target.value});
                    }}
                    className="form-input"
                  />
                  <p className="form-label" style={{ textAlign: 'right', marginTop: '8px' }}>
                    Vu le : **{selectedMovie.dateWatched ? formatDate(selectedMovie.dateWatched) : 'N/A'}**
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Titre"
                  value={selectedMovie.title || ''}
                  onChange={(e) => {
                    setSelectedMovie({...selectedMovie, title: e.target.value});
                    updateMovie(selectedMovie.id, {title: e.target.value});
                  }}
                  className="form-input"
                />

                <div className="form-group">
                  <label className="form-label">Note : {selectedMovie.rating}/20</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={selectedMovie.rating}
                    onChange={(e) => {
                      const newRating = parseInt(e.target.value);
                      setSelectedMovie({...selectedMovie, rating: newRating});
                      updateMovie(selectedMovie.id, {rating: newRating});
                    }}
                    className="form-range"
                  />
                  <div className={`rating-display ${getRatingColor(selectedMovie.rating)}`}>
                    {selectedMovie.rating}/20
                  </div>
                </div>

                <label className="form-label">Versions regardé</label>
                <div className="version-buttons">
                  <button
                    onClick={() => {
                      const newVersions = {...(selectedMovie.versions || {}), VF: !(selectedMovie.versions?.VF)};
                      setSelectedMovie({...selectedMovie, versions: newVersions});
                      updateMovie(selectedMovie.id, {versions: newVersions});
                    }}
                    className={`btn-version ${selectedMovie.versions?.VF ? 'active btn-version-vf' : ''}`}
                  >
                    VF
                  </button>
                  <button
                    onClick={() => {
                      const newVersions = {...(selectedMovie.versions || {}), VO: !(selectedMovie.versions?.VO)};
                      setSelectedMovie({...selectedMovie, versions: newVersions});
                      updateMovie(selectedMovie.id, {versions: newVersions});
                    }}
                    className={`btn-version ${selectedMovie.versions?.VO ? 'active btn-version-vo' : ''}`}
                  >
                    VO
                  </button>
                </div>
                
                <label className="form-label">Tags</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {predefinedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleSelectedMovieTag(tag)}
                      className={`tag-badge ${selectedMovie.tags?.includes(tag) ? 'active' : ''}`}
                      style={{ background: selectedMovie.tags?.includes(tag) ? '#a78bfa' : '#374151', cursor: 'pointer', border: 'none' }}
                    >
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </button>
                  ))}
                </div>

                <textarea
                  placeholder="Votre avis..."
                  value={selectedMovie.review || ''}
                  onChange={(e) => {
                    setSelectedMovie({...selectedMovie, review: e.target.value});
                    updateMovie(selectedMovie.id, {review: e.target.value});
                  }}
                  className="form-textarea"
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <input type="text" placeholder="Année" value={selectedMovie.year || ''} onChange={(e) => updateMovie(selectedMovie.id, {year: parseInt(e.target.value) || ''})} className="form-input" />
                  <input type="text" placeholder="Durée" value={selectedMovie.duration || ''} onChange={(e) => updateMovie(selectedMovie.id, {duration: e.target.value})} className="form-input" />
                  <input type="text" placeholder="Genre(s) (séparés par une virgule)" value={selectedMovie.genre || ''} onChange={(e) => updateMovie(selectedMovie.id, {genre: e.target.value})} className="form-input" />
                  <input type="text" placeholder="Plateforme" value={selectedMovie.platform || ''} onChange={(e) => updateMovie(selectedMovie.id, {platform: e.target.value})} className="form-input" />
                  <input type="text" placeholder="Réalisateur" value={selectedMovie.director || ''} onChange={(e) => updateMovie(selectedMovie.id, {director: e.target.value})} className="form-input" style={{ gridColumn: 'span 2' }} />
                  <input type="text" placeholder="Acteurs" value={selectedMovie.actors || ''} onChange={(e) => updateMovie(selectedMovie.id, {actors: e.target.value})} className="form-input" style={{ gridColumn: 'span 2' }} />
                </div>

                <button 
                  onClick={() => {
                    if(window.confirm(`Êtes-vous sûr de vouloir supprimer \"${selectedMovie.title}\" ?`)) {
                      deleteMovie(selectedMovie.id);
                    }
                  }}
                  className="btn-delete"
                  style={{ marginTop: '16px' }}
                >
                  Supprimer le film
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
