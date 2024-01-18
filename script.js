const perPage = 6;
let currentUser = '';
let isLoading = false; // To track the loading state

// Show the loader
function showLoader() {
    isLoading = true;
    document.getElementById('loader').style.display = 'block';
}

// Hide the loader
function hideLoader() {
    isLoading = false;
    document.getElementById('loader').style.display = 'none';
}

function searchUser() {
    const username = document.getElementById('search-input').value.trim();
    if (username) {
        currentUser = username;
        history.pushState({ search: username }, '', '#search');
        
        fetchUserProfile(username);
        fetchRepositories(username, 1);
        document.querySelector('.search-area').style.display = 'none';
    } else {
        console.log('Please enter a GitHub username');
    }
}

function fetchUserProfile(username) {
    showLoader();
    fetch(`https://api.github.com/users/${username}`)
        .then(response => response.json())
        .then(user => {
            displayUserProfile(user);
            document.getElementById('user-content').style.display = 'block';
        })
        .catch(error => console.error('Error fetching user profile:', error))
        .finally(() => hideLoader());
}

function fetchRepositories(username, page) {
    showLoader();
    fetch(`https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch repositories');
            const link = response.headers.get('Link');
            return Promise.all([response.json(), link]);
        })
        .then(([repos, linkHeader]) => {
            displayRepositories(repos);
            setupPagination(linkHeader, page);
        })
        .catch(error => console.error('Error fetching repositories:', error))
        .finally(() => hideLoader());
}

function fetchAndDisplayRepoLanguages(repo, cardBodyElement) {
    fetch(repo.languages_url)
        .then(response => response.json())
        .then(languages => {
            // Map through the languages and return a span element for each one
            const languageElements = Object.keys(languages).map(language =>
                `<span class="badge badge-language">${language}</span>`
            ).join(' ');
            
            // Create a div to contain the language badges and append to the card body
            const languagesDiv = document.createElement('div');
            languagesDiv.className = 'repo-languages';
            languagesDiv.innerHTML = languageElements;
            cardBodyElement.appendChild(languagesDiv);
        })
        .catch(error => console.error('Error fetching repository languages:', error));
}


function displayRepositories(repos) {
    const listDiv = document.getElementById('repository-list');
    listDiv.innerHTML = ''; // Clear previous content
    repos.forEach(repo => {
        const cardBodyElement = document.createElement('div');
        cardBodyElement.className = 'card-body';
        cardBodyElement.innerHTML = `
            <h5 class="card-title">${repo.name}</h5>
            <p class="card-text">${repo.description || 'No description available.'}</p>
        `;

        const repoCardElement = document.createElement('div');
        repoCardElement.className = 'col-12 col-md-6 col-lg-4 mb-3';
        repoCardElement.innerHTML = '<div class="card h-100"></div>';
        repoCardElement.firstChild.appendChild(cardBodyElement);

        listDiv.appendChild(repoCardElement);

        // Fetch and display languages for each repository
        fetchAndDisplayRepoLanguages(repo, cardBodyElement);
    });
}



function setupPagination(linkHeader, currentPage) {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = ''; // Clear previous pagination

    if (linkHeader) {
        const links = parseLinkHeader(linkHeader);
        if (links.prev) {
            paginationDiv.innerHTML += `<li class="page-item"><a class="page-link" href="#" onclick="fetchRepositories('${currentUser}', ${currentPage - 1})">Previous</a></li>`;
        }

        if (links.next) {
            paginationDiv.innerHTML += `<li class="page-item"><a class="page-link" href="#" onclick="fetchRepositories('${currentUser}', ${currentPage + 1})">Next</a></li>`;
        }
    }
}

// Function to parse the GitHub Link header
function parseLinkHeader(header) {
    if (!header || header.length === 0) {
        return {};
    }

    const parts = header.split(',');
    const links = {};
    parts.forEach(p => {
        const section = p.split(';');
        const url = section[0].replace(/<(.*)>/, '$1').trim();
        const name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    });

    return links;
}

function displayUserProfile(user) {
    const profileDiv = document.getElementById('user-profile');
    profileDiv.innerHTML = `
        <div class="profile-row">
            <div class="profile-column profile-image">
                <img src="${user.avatar_url}" alt="${user.name}" class="user-img">
                <a href="${user.html_url}" target="_blank" class="btn btn-dark view-profile-btn">View Profile</a>
            </div>
            <div class="profile-column profile-info">
                <h3>${user.name}</h3>
                <p>${user.bio || 'No bio available.'}</p>
                <p>${user.location || 'No location available.'}</p>
            </div>
        </div>
    `;
    // Show the user profile and repositories section
    document.getElementById('user-content').style.display = 'block';
}


// Event listener for the popstate event to handle the back button
window.addEventListener('popstate', (event) => {
    // Show the search bar if the history state is for the search page
    if (event.state && event.state.search) {
        document.querySelector('.search-area').style.display = 'block';
        document.getElementById('user-content').style.display = 'none';
    }
});

// Function to handle the initial state on page load
window.onload = () => {
    if (location.hash === '#search' && history.state && history.state.search) {
        searchUser();
    }
};


