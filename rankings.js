/***************************************
 * Variables globales
 ***************************************/
let allPlayersStats = [];
let competitionSet = new Set();
let teamSet = new Set();

let currentSortCol = null;
let currentSortOrder = "desc";

let currentPage = 1;
const itemsPerPage = 50;

/***************************************
 * Funciones de Responsividad
 ***************************************/
function setupMobileColumns() {
  const toggleButton = document.getElementById('toggleColumns');
  const tableContainer = document.querySelector('.stats-table-container');
  
  if (toggleButton && tableContainer) {
    toggleButton.addEventListener('click', () => {
      tableContainer.classList.toggle('mobile-all-columns');
      
      // Actualizar el texto del botón
      if (tableContainer.classList.contains('mobile-all-columns')) {
        toggleButton.textContent = 'Mostrar datos básicos';
        // Ajustar el scroll para mostrar las estadísticas adicionales
        setTimeout(() => {
          tableContainer.scrollLeft = 0;
        }, 100);
      } else {
        toggleButton.textContent = 'Mostrar más datos';
        // Resetear el scroll cuando volvemos a la vista básica
        tableContainer.scrollLeft = 0;
      }
    });

    // Añadir indicador de scroll
    const scrollIndicator = document.createElement('div');
    scrollIndicator.className = 'scroll-indicator';
    tableContainer.appendChild(scrollIndicator);

    // Mostrar/ocultar indicador de scroll según sea necesario
    tableContainer.addEventListener('scroll', () => {
      const maxScroll = tableContainer.scrollWidth - tableContainer.clientWidth;
      if (tableContainer.classList.contains('mobile-all-columns')) {
        scrollIndicator.style.opacity = tableContainer.scrollLeft < maxScroll ? '1' : '0';
      } else {
        scrollIndicator.style.opacity = '0';
      }
    });
  }
}

function setupMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.querySelector('.main-nav');
  const body = document.body;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  body.appendChild(overlay);

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      mainNav.classList.toggle('active');
      overlay.classList.toggle('active');
      body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
    });

    overlay.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      mainNav.classList.remove('active');
      overlay.classList.remove('active');
      body.style.overflow = '';
    });

    const navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mainNav.classList.remove('active');
        overlay.classList.remove('active');
        body.style.overflow = '';
      });
    });
  }
}

/***************************************
 * Funciones principales
 ***************************************/
async function fetchMatchFiles() {
  const apiUrl = "https://api.github.com/repos/emebullon/mini2025/contents/";
  try {
    const response = await fetch(apiUrl);
    const files = await response.json();
    return files.filter(file => file.name.endsWith(".json")).map(file => file.download_url);
  } catch (error) {
    console.error("Error al obtener la lista de archivos:", error);
    return [];
  }
}

async function loadAllStats() {
  const urls = await fetchMatchFiles();
  const playersMap = new Map();

  for (const url of urls) {
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      const comp = data.HEADER.competition || "";
      competitionSet.add(comp);

      const matchDate = data.HEADER.starttime || "";
      const scoreboardTeams = data.SCOREBOARD.TEAM;
      const teamAName = scoreboardTeams[0].name || "Equipo A";
      const teamBName = scoreboardTeams[1].name || "Equipo B";

      scoreboardTeams.forEach((teamObj, index) => {
        const teamName = teamObj.name || "Equipo X";
        teamSet.add(teamName);

        const rivalName = (index === 0) ? teamBName : teamAName;

        const femaleCompetitions = [
          "LF Endesa",
          "LF Challenge",
          "L.F. 2",
          "CE SSAA Cadete Fem.",
          "CE SSA Infantil Fem."
        ];
        let genero = "H";
        if (femaleCompetitions.some(f => f.toLowerCase() === comp.trim().toLowerCase())) {
          genero = "M";
        }

        (teamObj.PLAYER || []).forEach(player => {
          const playerId = `${player.id}-${teamName}-${comp}`;
          if (!playersMap.has(playerId)) {
            playersMap.set(playerId, {
              dorsal: player.no || "",
              playerPhoto: player.logo || "https://via.placeholder.com/50",
              playerName: player.name || "Desconocido",
              teamName,
              competition: comp,
              gender: genero,
              games: 0,
              pts: 0,
              t2i: 0,
              t2c: 0,
              t3i: 0,
              t3c: 0,
              tli: 0,
              tlc: 0,
              ro: 0,
              rd: 0,
              rt: 0,
              as: 0,
              br: 0,
              bp: 0,
              tp: 0,
              fc: 0,
              va: 0,
              pm: 0,
              matches: []
            });
          }
          const record = playersMap.get(playerId);
          record.games += 1;

          const p2a = parseInt(player.p2a || 0);
          const p2m = parseInt(player.p2m || 0);
          const p3a = parseInt(player.p3a || 0);
          const p3m = parseInt(player.p3m || 0);
          const p1a = parseInt(player.p1a || 0);
          const p1m = parseInt(player.p1m || 0);

          record.pts += parseInt(player.pts || 0);
          record.t2i += p2a;
          record.t2c += p2m;
          record.t3i += p3a;
          record.t3c += p3m;
          record.tli += p1a;
          record.tlc += p1m;
          record.ro += parseInt(player.ro || 0);
          record.rd += parseInt(player.rd || 0);
          record.rt += parseInt(player.rt || 0);
          record.as += parseInt(player.assist || 0);
          record.br += parseInt(player.st || 0);
          record.bp += parseInt(player.to || 0);
          record.tp += parseInt(player.bs || 0);
          record.fc += parseInt(player.pf || 0);
          record.va += parseInt(player.val || 0);
          record.pm += parseInt(player.pllss || 0);

          const pct2 = (p2a > 0) ? ((p2m / p2a) * 100).toFixed(1) : "0.0";
          const pct3 = (p3a > 0) ? ((p3m / p3a) * 100).toFixed(1) : "0.0";
          const pctTl = (p1a > 0) ? ((p1m / p1a) * 100).toFixed(1) : "0.0";

          record.matches.push({
            matchDate,
            rival: rivalName,
            pts: parseInt(player.pts || 0),
            t2i: p2a,
            t2c: p2m,
            pct2,
            t3i: p3a,
            t3c: p3m,
            pct3,
            tli: p1a,
            tlc: p1m,
            pctTl,
            ro: parseInt(player.ro || 0),
            rd: parseInt(player.rd || 0),
            rt: parseInt(player.rt || 0),
            as: parseInt(player.assist || 0),
            br: parseInt(player.st || 0),
            bp: parseInt(player.to || 0),
            tp: parseInt(player.bs || 0),
            fc: parseInt(player.pf || 0),
            va: parseInt(player.val || 0),
            pm: parseInt(player.pllss || 0)
          });
        });
      });
    } catch (err) {
      console.error("Error al cargar", url, err);
    }
  }

  allPlayersStats = Array.from(playersMap.values());
  fillSelects();
  applyFilters();
}

function fillSelects() {
  const filterCompetition = document.getElementById("filterCompetition");
  const filterTeam = document.getElementById("filterTeam");

  competitionSet.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    filterCompetition.appendChild(opt);
  });

  teamSet.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    filterTeam.appendChild(opt);
  });
}

function applyFilters() {
  const compSel = document.getElementById("filterCompetition").value;
  const teamSel = document.getElementById("filterTeam").value;
  const genderSel = document.getElementById("filterGender").value;
  const modeToggle = document.getElementById("modeToggle");
  const searchInput = document.getElementById("searchPlayerTeam");
  const searchTerm = searchInput.value.toLowerCase();

  let filteredData = allPlayersStats.filter(player => {
    const matchesComp = !compSel || player.competition === compSel;
    const matchesTeam = !teamSel || player.teamName === teamSel;
    const matchesGender = !genderSel || player.gender === genderSel;
    const matchesSearch = !searchTerm || 
      player.playerName.toLowerCase().includes(searchTerm) || 
      player.teamName.toLowerCase().includes(searchTerm);

    return matchesComp && matchesTeam && matchesGender && matchesSearch;
  });

  if (currentSortCol) {
    filteredData = sortArray(filteredData, currentSortCol, currentSortOrder, modeToggle.checked ? "promedios" : "totales");
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  renderTable(paginatedData, modeToggle.checked ? "promedios" : "totales");
  updatePaginationInfo(filteredData.length);
}

function limitName(name, maxChars = 15) {
  return name.length > maxChars ? name.substring(0, maxChars) + "..." : name;
}

function getInitials(name) {
  return name.split(" ").map(word => word[0]).join("");
}

function renderTable(data, mode = "totales") {
  const tbody = document.querySelector("#statsTable tbody");
  tbody.innerHTML = "";

  data.forEach((player, index) => {
    const row = document.createElement("tr");
    const rank = (currentPage - 1) * itemsPerPage + index + 1;

    // Calcular los valores que se mostrarán
    const pts = mode === "totales" ? player.pts : (player.pts / player.games).toFixed(1);
    const t2c = mode === "totales" ? player.t2c : (player.t2c / player.games).toFixed(1);
    const t2i = mode === "totales" ? player.t2i : (player.t2i / player.games).toFixed(1);
    const t3c = mode === "totales" ? player.t3c : (player.t3c / player.games).toFixed(1);
    const t3i = mode === "totales" ? player.t3i : (player.t3i / player.games).toFixed(1);
    const tlc = mode === "totales" ? player.tlc : (player.tlc / player.games).toFixed(1);
    const tli = mode === "totales" ? player.tli : (player.tli / player.games).toFixed(1);
    const ro = mode === "totales" ? player.ro : (player.ro / player.games).toFixed(1);
    const rd = mode === "totales" ? player.rd : (player.rd / player.games).toFixed(1);
    const rt = mode === "totales" ? player.rt : (player.rt / player.games).toFixed(1);
    const as = mode === "totales" ? player.as : (player.as / player.games).toFixed(1);
    const br = mode === "totales" ? player.br : (player.br / player.games).toFixed(1);
    const bp = mode === "totales" ? player.bp : (player.bp / player.games).toFixed(1);
    const tp = mode === "totales" ? player.tp : (player.tp / player.games).toFixed(1);
    const fc = mode === "totales" ? player.fc : (player.fc / player.games).toFixed(1);
    const va = mode === "totales" ? player.va : (player.va / player.games).toFixed(1);
    const pm = mode === "totales" ? player.pm : (player.pm / player.games).toFixed(1);

    // Calcular porcentajes
    const pct2 = player.t2i > 0 ? ((player.t2c / player.t2i) * 100).toFixed(1) : "0.0";
    const pct3 = player.t3i > 0 ? ((player.t3c / player.t3i) * 100).toFixed(1) : "0.0";
    const pctTl = player.tli > 0 ? ((player.tlc / player.tli) * 100).toFixed(1) : "0.0";

    // Abreviar nombre del equipo
    const teamName = player.teamName;
    const shortTeamName = teamName.length > 3 ? teamName.substring(0, 3) : teamName;

    row.innerHTML = `
      <td>${rank}</td>
      <td>${player.dorsal}</td>
      <td><img src="${player.playerPhoto}" alt="${player.playerName}" class="player-photo"></td>
      <td data-col="playerName">${limitName(player.playerName)}</td>
      <td class="team-name" data-fullname="${teamName}">${shortTeamName}</td>
      <td data-col="pts">${pts}</td>
      <td data-col="t2c">${t2c}</td>
      <td data-col="t2i">${t2i}</td>
      <td data-col="pct2">${pct2}</td>
      <td data-col="t3c">${t3c}</td>
      <td data-col="t3i">${t3i}</td>
      <td data-col="pct3">${pct3}</td>
      <td data-col="tlc">${tlc}</td>
      <td data-col="tli">${tli}</td>
      <td data-col="pctTl">${pctTl}</td>
      <td data-col="ro">${ro}</td>
      <td data-col="rd">${rd}</td>
      <td data-col="rt">${rt}</td>
      <td data-col="as">${as}</td>
      <td data-col="br">${br}</td>
      <td data-col="bp">${bp}</td>
      <td data-col="tp">${tp}</td>
      <td data-col="fc">${fc}</td>
      <td data-col="va">${va}</td>
      <td data-col="pm">${pm}</td>
      <td class="games-cell" onclick="toggleMatchDetails(this, ${JSON.stringify(player).replace(/"/g, '&quot;')})">${player.games}</td>
    `;

    tbody.appendChild(row);
  });
}

function toggleMatchDetails(cell, player) {
  const row = cell.parentElement;
  const nextRow = row.nextElementSibling;

  if (nextRow && nextRow.classList.contains("details-row")) {
    nextRow.remove();
  } else {
    const detailsRow = document.createElement("tr");
    detailsRow.className = "details-row";
    
    const detailsCell = document.createElement("td");
    detailsCell.colSpan = 26;
    
    const detailsTable = document.createElement("table");
    detailsTable.className = "match-details-table";
    
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Fecha</th>
        <th>Rival</th>
        <th>PTS</th>
        <th>T2C</th>
        <th>T2I</th>
        <th>%T2</th>
        <th>T3C</th>
        <th>T3I</th>
        <th>%T3</th>
        <th>TLC</th>
        <th>TLI</th>
        <th>%TL</th>
        <th>RO</th>
        <th>RD</th>
        <th>RT</th>
        <th>AS</th>
        <th>BR</th>
        <th>BP</th>
        <th>TP</th>
        <th>FC</th>
        <th>VA</th>
        <th>+/-</th>
      </tr>
    `;
    
    const tbody = document.createElement("tbody");
    player.matches.forEach(match => {
      const matchRow = document.createElement("tr");
      matchRow.innerHTML = `
        <td>${match.matchDate}</td>
        <td>${match.rival}</td>
        <td>${match.pts}</td>
        <td>${match.t2c}</td>
        <td>${match.t2i}</td>
        <td>${match.pct2}</td>
        <td>${match.t3c}</td>
        <td>${match.t3i}</td>
        <td>${match.pct3}</td>
        <td>${match.tlc}</td>
        <td>${match.tli}</td>
        <td>${match.pctTl}</td>
        <td>${match.ro}</td>
        <td>${match.rd}</td>
        <td>${match.rt}</td>
        <td>${match.as}</td>
        <td>${match.br}</td>
        <td>${match.bp}</td>
        <td>${match.tp}</td>
        <td>${match.fc}</td>
        <td>${match.va}</td>
        <td>${match.pm}</td>
      `;
      tbody.appendChild(matchRow);
    });
    
    detailsTable.appendChild(thead);
    detailsTable.appendChild(tbody);
    detailsCell.appendChild(detailsTable);
    detailsRow.appendChild(detailsCell);
    row.parentNode.insertBefore(detailsRow, nextRow);
  }
}

function sortByColumn(colKey) {
  if (currentSortCol === colKey) {
    currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
  } else {
    currentSortCol = colKey;
    currentSortOrder = "desc";
  }

  const modeToggle = document.getElementById("modeToggle");
  allPlayersStats = sortArray(
    allPlayersStats,
    colKey,
    currentSortOrder,
    modeToggle.checked ? "promedios" : "totales"
  );

  highlightSortedColumn(colKey);
  applyFilters();
}

function sortArray(array, colKey, order, mode) {
  return [...array].sort((a, b) => {
    const aValue = getSortValue(a, colKey, mode);
    const bValue = getSortValue(b, colKey, mode);

    if (order === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
}

function getSortValue(obj, colKey, mode) {
  if (mode === "promedios" && obj.games > 0) {
    return obj[colKey] / obj.games;
  }
  return obj[colKey];
}

function highlightSortedColumn(colKey) {
  const ths = document.querySelectorAll("#statsTable thead th");
  ths.forEach(th => {
    th.classList.remove("sorted-asc", "sorted-desc");
    if (th.dataset.col === colKey) {
      th.classList.add(currentSortOrder === "asc" ? "sorted-asc" : "sorted-desc");
    }
  });
}

function updatePaginationInfo(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageInfo = document.getElementById("pageInfo");
  pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;

  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

/***************************************
 * Inicialización
 ***************************************/
document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupMobileColumns();
  loadAllStats();

  document.getElementById("btnApplyFilters").addEventListener("click", () => {
    currentPage = 1;
    applyFilters();
  });

  const ths = document.querySelectorAll("#statsTable thead th");
  ths.forEach(th => {
    th.addEventListener("click", () => {
      const colKey = th.dataset.col;
      if (colKey) {
        sortByColumn(colKey);
      }
    });
  });

  const modeToggle = document.getElementById("modeToggle");
  if (modeToggle) {
    modeToggle.addEventListener("change", () => {
      currentPage = 1;
      applyFilters();
    });
  }

  const searchInput = document.getElementById("searchPlayerTeam");
  searchInput.addEventListener("input", () => {
    currentPage = 1;
    applyFilters();
  });

  document.getElementById("prevPageBtn").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      applyFilters();
    }
  });

  document.getElementById("nextPageBtn").addEventListener("click", () => {
    currentPage++;
    applyFilters();
  });
}); 