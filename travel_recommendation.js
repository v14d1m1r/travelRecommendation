document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resetBtn = document.getElementById('resetBtn');
    const results = document.getElementById('results');

    let apiData = null;

    // Fetch the JSON data
    fetch('travel_recommendation_api.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok: ' + response.status);
            return response.json();
        })
        .then(data => {
            apiData = data;
            console.log('Loaded recommendation data:', apiData);
        })
        .catch(err => {
            console.error('Failed to load recommendation data:', err);
            results.innerHTML = '<div class="result-item">Failed to load recommendation data. Check console for details.</div>';
        });

    function searchItems(query) {
        if (!apiData) return [];
        const q = query.toLowerCase();
        const matches = [];

        const isBeachQuery = ['beach', 'beaches'].some(k => q.includes(k));
        const isTempleQuery = ['temple', 'temples'].some(k => q.includes(k));
        const isCountryKeyword = ['country', 'countries'].some(k => q.includes(k));

        // If user asked for beaches (any variation), return all beaches
        if (isBeachQuery) {
            (apiData.beaches || []).forEach(b => {
                matches.push({ title: b.name, description: b.description, imageUrl: b.imageUrl, category: 'Beach' });
            });
        }

        // If user asked for temples (any variation), return all temples
        if (isTempleQuery) {
            (apiData.temples || []).forEach(t => {
                matches.push({ title: t.name, description: t.description, imageUrl: t.imageUrl, category: 'Temple' });
            });
        }

        // If user asked for countries (keyword) return country summaries
        if (isCountryKeyword) {
            (apiData.countries || []).forEach(country => {
                const cities = (country.cities || []).map(c => c.name).join(', ');
                const imageUrl = (country.cities && country.cities[0] && country.cities[0].imageUrl) || '';
                matches.push({ title: country.name, description: 'Cities: ' + cities, imageUrl: imageUrl, category: 'Country' });
            });
        }

        // Generic matching: match cities, temples, beaches, and countries by name/description
        (apiData.countries || []).forEach(country => {
            (country.cities || []).forEach(city => {
                if (
                    city.name.toLowerCase().includes(q) ||
                    city.description.toLowerCase().includes(q) ||
                    country.name.toLowerCase().includes(q)
                ) {
                    matches.push({
                        title: city.name,
                        description: city.description,
                        imageUrl: city.imageUrl,
                        category: country.name
                    });
                }
            });
        });

        (apiData.temples || []).forEach(t => {
            if (t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
                matches.push({ title: t.name, description: t.description, imageUrl: t.imageUrl, category: 'Temple' });
            }
        });

        (apiData.beaches || []).forEach(b => {
            if (b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)) {
                matches.push({ title: b.name, description: b.description, imageUrl: b.imageUrl, category: 'Beach' });
            }
        });

        // Deduplicate by title
        const unique = [];
        const seen = new Set();
        matches.forEach(m => {
            if (!seen.has(m.title)) {
                seen.add(m.title);
                unique.push(m);
            }
        });

        console.log('Search for', query, '-> found', unique.length, 'items');
        return unique;
    }

    function renderResults(query) {
        results.innerHTML = '';
        const qtrim = (query || '').trim();
        if (!qtrim) {
            results.innerHTML = '<div class="result-item">Please enter a keyword and click Search.</div>';
            return;
        }

        const q = qtrim.toLowerCase();
        const isBeachQuery = ['beach', 'beaches'].some(k => q.includes(k));
        const isTempleQuery = ['temple', 'temples'].some(k => q.includes(k));
        const isCountryKeyword = ['country', 'countries'].some(k => q.includes(k));

        const items = searchItems(query);

        // Header showing count and query
        const header = document.createElement('div');
        header.className = 'results-header';
        header.textContent = `Showing ${items.length} recommendation${items.length !== 1 ? 's' : ''} for "${qtrim}"`;
        results.appendChild(header);

        if (!items.length) {
            results.appendChild(document.createElement('div')).className = 'result-item';
            results.querySelector('.result-item').textContent = 'No results found for "' + qtrim + '".';
            return;
        }

        // If a category keyword was used, ensure at least two recommendations are shown (if available)
        let toShow = items;
        if ((isBeachQuery || isTempleQuery || isCountryKeyword) && items.length > 2) {
            // show all, but maintained; if you prefer to limit: toShow = items.slice(0, 2);
            toShow = items; // keep all so user sees variety
        }

        toShow.forEach(item => {
            const div = document.createElement('div');
            div.className = 'result-item';

            const img = document.createElement('img');
            img.src = item.imageUrl || 'https://via.placeholder.com/140x90?text=No+Image';
            img.alt = item.title;
            img.style.width = '140px';
            img.style.height = '90px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '6px';
            img.onerror = function() { this.src = 'https://via.placeholder.com/140x90?text=No+Image'; };

            const info = document.createElement('div');
            info.style.flex = '1';

            const title = document.createElement('div');
            title.textContent = item.title;
            title.style.fontWeight = 'bold';

            const cat = document.createElement('div');
            cat.textContent = item.category;
            cat.style.color = '#666';
            cat.style.fontSize = '13px';

            const desc = document.createElement('div');
            desc.textContent = item.description;
            desc.style.marginTop = '6px';

            info.appendChild(title);
            info.appendChild(cat);
            info.appendChild(desc);

            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '12px';

            row.appendChild(img);
            row.appendChild(info);

            div.appendChild(row);
            results.appendChild(div);
        });
    }

    searchBtn.addEventListener('click', function() {
        const q = searchInput.value.trim();
        renderResults(q);
    });

    resetBtn.addEventListener('click', function() {
        // Reset clears the input and the results
        searchInput.value = '';
        clearResults();
        searchInput.focus();
    });

    // Clear button only clears previous results but keeps the query in the input
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            clearResults();
            searchInput.focus();
        });
    }

    function clearResults() {
        results.innerHTML = '';
    }

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Do not trigger search on Enter — only on Search button click
        }
    });

    const dtOptions = {
        timeZone: 'Europe/Belgrade',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    };
    
    const belgradeDateTime = new Date().toLocaleString('en-GB', dtOptions);
    console.log("Current date & time in Belgrade:", belgradeDateTime);
});
