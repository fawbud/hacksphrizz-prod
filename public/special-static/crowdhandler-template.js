// Fetch and display train recommendations
(function() {
   const trainId = sessionStorage.getItem('ch_train_id');

   if (!trainId) {
      console.log('No train ID found in sessionStorage');
      return;
   }

   console.log('Fetching recommendations for train ID:', trainId);

   // Fetch recommendations from public API
   fetch('https://www.quikyu.xyz/api/trains/public?train_id=' + trainId)
      .then(response => response.json())
      .then(data => {
         const trains = data.trains || [];
         console.log('Fetched trains:', trains);

         if (trains.length === 0) {
            return;
         }

         // Show the recommendations section
         const recSection = document.getElementById('ch-recommendations');
         if (recSection) {
            recSection.classList.remove('ch-hide');
            recSection.classList.add('ch-show');
         }

         // Display train recommendations
         const listContainer = document.getElementById('ch-recommendations-list');
         if (!listContainer) return;

         listContainer.innerHTML = '';

         // Get stored date
         const storedDate = sessionStorage.getItem('ch_train_date') || '2026-01-01';

         trains.slice(0, 3).forEach(train => {
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
                  <a href="https://www.quikyu.xyz/trains?from=${train.departure_station_code}&to=${train.arrival_station_code}&date=${storedDate}&roundTrip=false" class="ch-rec-btn">
                     View Details
                  </a>
               </div>
            `;

            listContainer.appendChild(trainCard);
         });
      })
      .catch(error => {
         console.error('Error fetching train recommendations:', error);
      });
})();
