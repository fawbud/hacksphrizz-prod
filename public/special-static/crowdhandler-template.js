// Fetch and display train recommendations
(function() {
   function loadRecommendations() {
      console.log('[CH Recommendations] Script loaded');

      // Extract train ID from the CrowdHandler URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const originalUrl = urlParams.get('url');
      console.log('[CH Recommendations] Original URL from CrowdHandler:', originalUrl);

      if (!originalUrl) {
         console.log('[CH Recommendations] No original URL found in CrowdHandler redirect');
         return;
      }

      // Parse the original URL to extract train ID
      let trainId = null;
      let trainDate = null;

      try {
         const decodedUrl = decodeURIComponent(originalUrl);
         console.log('[CH Recommendations] Decoded URL:', decodedUrl);

         const urlObj = new URL(decodedUrl);
         trainId = urlObj.searchParams.get('train');
         trainDate = urlObj.searchParams.get('date');

         console.log('[CH Recommendations] Extracted train ID:', trainId);
         console.log('[CH Recommendations] Extracted date:', trainDate);
      } catch (error) {
         console.error('[CH Recommendations] Error parsing URL:', error);
         return;
      }

      if (!trainId) {
         console.log('[CH Recommendations] No train ID found in URL');
         return;
      }

      console.log('[CH Recommendations] Fetching recommendations for train ID:', trainId);

      // Fetch recommendations from public API
      fetch('https://www.quikyu.xyz/api/trains/public?train_id=' + trainId)
         .then(response => {
            console.log('[CH Recommendations] API response status:', response.status);
            return response.json();
         })
         .then(data => {
            console.log('[CH Recommendations] API response data:', data);
            const trains = data.trains || [];
            console.log('[CH Recommendations] Number of trains:', trains.length);

            if (trains.length === 0) {
               console.log('[CH Recommendations] No trains found');
               return;
            }

            // Show the recommendations section
            const recSection = document.getElementById('ch-recommendations');
            console.log('[CH Recommendations] Recommendations section element:', recSection);

            if (recSection) {
               recSection.classList.remove('ch-hide');
               recSection.classList.add('ch-show');
               console.log('[CH Recommendations] Section shown');
            } else {
               console.error('[CH Recommendations] Could not find #ch-recommendations element');
            }

            // Display train recommendations
            const listContainer = document.getElementById('ch-recommendations-list');
            console.log('[CH Recommendations] List container:', listContainer);

            if (!listContainer) {
               console.error('[CH Recommendations] Could not find #ch-recommendations-list element');
               return;
            }

            listContainer.innerHTML = '';

            // Use the extracted date or fallback
            const displayDate = trainDate || '2026-01-01';

            trains.slice(0, 3).forEach((train, index) => {
               console.log('[CH Recommendations] Rendering train', index + 1, ':', train.train_name);

               const trainCard = document.createElement('div');
               trainCard.className = 'ch-rec-card';

               const formatTime = (timeStr) => timeStr.substring(0, 5);

               trainCard.innerHTML = `
                  <div class="ch-rec-header">
                     <div class="ch-rec-badge">${train.train_class}</div>
                     <div class="ch-rec-availability ${train.available_seats <= 10 ? 'ch-rec-low' : 'ch-rec-ok'}">
                        ${train.available_seats <= 10 ? train.available_seats + ' Seats Left' : 'Available'}
                     </div>
                  </div>
                  <h4 class="ch-rec-name">${train.train_name} (${train.train_code})</h4>
                  <div class="ch-rec-journey">
                     <div class="ch-rec-station">
                        <div class="ch-rec-time">${formatTime(train.departure_time)}</div>
                        <div class="ch-rec-code">${train.departure_station_code}</div>
                     </div>
                     <div class="ch-rec-arrow">→</div>
                     <div class="ch-rec-station">
                        <div class="ch-rec-time">${formatTime(train.arrival_time)}</div>
                        <div class="ch-rec-code">${train.arrival_station_code}</div>
                     </div>
                  </div>
                  <div class="ch-rec-footer">
                     <div class="ch-rec-price">Rp${train.base_price.toLocaleString('id-ID')}</div>
                     <a href="https://www.quikyu.xyz/trains?from=${train.departure_station_code}&to=${train.arrival_station_code}&date=${displayDate}&roundTrip=false" class="ch-rec-btn">
                        View Details
                     </a>
                  </div>
               `;

               listContainer.appendChild(trainCard);
            });

            console.log('[CH Recommendations] Successfully rendered', trains.slice(0, 3).length, 'train cards');
         })
         .catch(error => {
            console.error('[CH Recommendations] Error fetching train recommendations:', error);
         });
   }

   // Wait for DOM to be ready
   if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadRecommendations);
   } else {
      // DOM is already ready, execute immediately
      loadRecommendations();
   }
})();
