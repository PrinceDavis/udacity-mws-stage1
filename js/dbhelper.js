/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  
  
  /**
   * @desc  esterblishs a connection to indexeDB
   * @return indexedDB connection
   */
  static connectIDB() {
    return idb.open("restaurant-store", 2, (db) => {
      switch (db.oldVersion) {
        case 0:
        db.createObjectStore("restaurants", { keyPath: "id"});
        case 1:
        db.createObjectStore("review-queue", {keyPath: "restaurant_id"});
      }
    })
  }

  static postReview(data) {
    // check for network and queue data locally if there is none
    return fetch(DBHelper.DATABASE_URL, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    })
  }
  /**
   * @desc put restaurant data into local cache
   * @param  {array} restaurants 
   */
  static storeRestaurantLocally(restaurants) {
    DBHelper.connectIDB().then(db => {
      if(!db) return;
      const store = db.transaction("restaurants", "readwrite").objectStore("restaurants");
      restaurants.forEach(restaurant => {
        store.put(restaurant);
      });
    });
  }


  /**
   * Temporarily store new reviews local while users can't access the internet
   * @param {object} data 
   */
  static queueReview(data) {
    return DBHelper.connectIDB().then(db => {
      if(!db) return Promise.resolve();

      console.log(data);
      const tx = db.transaction("review-queue", "readwrite");
      tx.objectStore("review-queue").put(data);
      return tx.complete;
    })
  }

  /**
   * @desc fetch restaurant data cached locally
   * @return {Promise<Array>}
   */
  static getCachedRestaurantData() {
    return DBHelper.connectIDB().then(db => {
      return db.transaction("restaurants").objectStore("restaurants").getAll();
    })
  }

  /**
   * Fetch all reveiws in local store
   */
  static getCachedReviews() {
    return DBHelper.connectIDB().then(db => {
      return db.transaction("review-queue").objectStore("review-queue").getAll();
    })
  }

  /**
   * Delete all a queued review
   */
  static deleteReview(reveiw) {
    DBHelper.connectIDB().then(db => {
      db.transaction("review-queue", "readwrite").objectStore("review-queue")
        .delete(reveiw.restaurant_id);
    })
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.getCachedRestaurantData().then(restaurants => {
      if(restaurants[0]) {
        callback(null, restaurants);
      }else {
        fetch(DBHelper.DATABASE_URL).then(res => res.json())
        .then(data => {
          DBHelper.storeRestaurantLocally(data);
          callback(null, data);
        }).catch(err => callback(err, null));
      }
    })    
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 

}

