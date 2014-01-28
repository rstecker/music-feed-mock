/*globals rdioUtils, Main, R, zot, console */

(function() {

  // ----------
  window.Main = {
    albums: [],

    // ----------
    init: function() {
      var self = this;

      this.log('starting');

      if (!rdioUtils.startupChecks()) {
        return;
      }

      this._columns = -1;

      this.dummyText = 'If you have a problem if no one else can help and if you can find them maybe you can hire The A-Team. I have always wanted to have a neighbor just like you. I\'ve always wanted to live in a neighborhood with you. Space. The final frontier. These are the voyages of the Starship Enterprise. These Happy Days are yours and mine Happy Days. Movin\' on up to the east side. We finally got a piece of the pie. Michael Knight a young loner on a crusade to champion the cause of the innocent. The helpless. The powerless in a world of criminals who operate above the law. As long as we live its you and me baby. There ain\'t nothin\' wrong with that. And you know where you were then. Girls were girls and men were men. Mister we could use a man like Herbert Hoover again!';
      // mock strings for organization info
      this.belongsTo = ['Music Magazine', 'of My Morning Jacket', 'Singer and TV Host', 'Rdio'];

      R.ready(function() {
        if (R.authenticated()) {
          self.getStarted();
        } else {
          $('.main-content').append(self.template('no-auth'));

          $('.auth').click(function() {
            R.authenticate(function(authenticated) {
              if (authenticated) {
                $('.no-auth').remove();
                self.getStarted();
              }
            });
          });
        }
      });

      $(window)
        .resize(function() {
          self.log('resize');
        });
    },
    extractPrettyPeople: function() {
      var self = this;
      self.log('extracting people');
      var allPeople = [];
      var person;
      var following = R.currentUser.get('following');
      for (var i = 0; i < following.length; i++) {
        person = following.at(i);
        allPeople.push({
          icon: person.get('icon'),
          firstName: person.get('firstName'),
          lastName: person.get('lastName')
        });
      }

      self.log('filtering people');
      var prettyPeople = _.filter(allPeople, function(person) {
        return !/no-user-image/i.test(person.icon);
      });

      self.log('adding reasons');
      _.each(prettyPeople, function(v, i) {
        v.reason1 = 'Followed by ' + allPeople[self.random(0, allPeople.length)].firstName + ',';
        v.reason2 = allPeople[self.random(0, allPeople.length)].firstName + ' & ' + self.random(2, 22) + ' others.';
      });
      return prettyPeople;
    },
    showSomeAlbums: function(prettyPeople, newReleasesRequestResult, topPlaylistsRequestResult, stationsRequestResult) {
      var self = this;
      var $row, $inner;

      self.log('creating units');
      var cleanserCountdown = -1;
      newReleasesRequestResult = _.shuffle(newReleasesRequestResult)
      topPlaylistsRequestResult = _.shuffle(topPlaylistsRequestResult)
      var body = $('body');
      this.picker = new window.ColorPicker();
      for (var i = 0; i < newReleasesRequestResult.length; ++i) {
        var r = newReleasesRequestResult[i];
        var data = { icon: this.correctIcon(r.icon), artist: r.artist, album: r.name }
        var el = Main.template('alb-sample', data).appendTo(body);
        el.click(function(e) {
          return function() { self.picker.colorArtwork(e);}
        }(el));
      }
      this.picker.printValidColors();

      self.log('initial layout');
      self.log('startup complete');
    },
    _albumDataExtract: function(a) {
      return { 
          icon: this.correctIcon(a.icon),
          title: a.name,
          subtitle: a.artist
        };
    },
    _playlistsDataExtract: function(p) {
      return { 
          icon: this.correctIcon(p.icon),
          title: p.name,
          subtitle: 'by ' + p.owner
        };
    },
    _peopleDataExtract: function(p) {
      return {
        icon: this.correctIcon(p.icon),
        title: p.firstName + ' ' + p.lastName,
        subtitle: _.sample(this.belongsTo)
      };
    },
    generateHeavyRotation: function(body, albums, playlists) {
      var data = {
        title: "Your friends are listening",
        subtitle: "Thursday, January 15th 2014",
        entries: []
      }
      albums = _.shuffle(albums)
      playlists = _.shuffle(playlists)
      for (var i = 0; i < 7; ++i){
        data.entries.push(this._albumDataExtract(albums[i]))
      }
      for (var i = 0; i < 2; ++i){
        data.entries.push(this._playlistsDataExtract(playlists[i]))
      }
      data.entries = _.shuffle(data.entries)
      var el = Main.template('heavyRotation', data).appendTo(body);
      return el;
    },
    generateReview: function(body, people, albums, playlists) {
      user = _.shuffle(people)[0];
      album = _.shuffle(albums)[0];
      data = {
        userIcon: this.correctIcon(user.icon),
        title: user.firstName + ' ' + user.lastName + ' reviewed an album',
        subtitle: album.name + ' - ' + album.artist,
        albumIcon: this.correctIcon(album.icon),
        comment: 'Pariatur Truffaut delectus chia distillery fingerstache photo booth. Pork belly organic yr pariatur, beard YOLO kale chips pickled. Mixtape minim XOXO kitsch ex photo booth esse.',
        timestamp: '49 mins ago'
      }
      if (Math.random() < .2) {
        data.comment = 'Odio mumblecore quinoa, single-origin coffee four loko kitsch laboris ugh. Excepteur nulla non tofu in, cillum Neutra chillwave organic hashtag ea Brooklyn meggings. Forage craft beer veniam artisan, eiusmod sapiente cardigan Odd Future in accusamus narwhal nostrud hella. Meh Godard dreamcatcher VHS. Mixtape chambray aliqua, mollit elit biodiesel Shoreditch assumenda hashtag deep v forage adipisicing cillum salvia ethnic. Pop-up tofu Schlitz blog seitan. Hoodie bitters cupidatat Intelligentsia adipisicing typewriter.';
      } else if (Math.random() < .2) {
        data.comment = 'Food truck bespoke Pitchfork';
      }
      var el = Main.template('comment', data).appendTo(body);
      return el;
    },
    generatePopular: function(body, albums) {
      album = _.shuffle(albums)[0];
      data = {
        userIcon: false,
        icon: 'meter',
        title: 'Popular with your friends',
        subtitle: album.name + ' - ' + album.artist,
        albumIcon: this.correctIcon(album.icon)
      }
      var el = Main.template('popular', data).appendTo(body);
      return el;
    },
    generateGenericReleases: function(body, albums, title, subtitle, icon, userIcon) {
      albums = _.shuffle(albums);
      data = { 
        title: title,
        subtitle: subtitle,
        icon: icon,
        userIcon: userIcon,
        entries: []
      }
      for (var i = 0; i < 3; ++i) {
        var e = this._albumDataExtract(albums[i]);
        console.warn(albums[i]);
        e.tracks = albums[i].length + ' tracks';
        data.entries.push(e);
      }
      var el = Main.template('generic', data).appendTo(body);
      return el;
    },

    generatePeopleToFollow: function(body, people) {
      var data = {
        title: 'People to follow',
        subtitle: 'Rdio is better with friends',
        entries: []
      };
      people = _.shuffle(people);
      for (var i = 0; i < 6; i++) {
        data.entries.push(this._peopleDataExtract(people[i]));
      }
      var el = Main.template('people', data).appendTo(body);
      return el;
    },

    makeOddElement: function(body, people, albums, playlists, stations) {
      switch (this.random(0, 3)) {
        case 0:
          return this.generatePopular(body, albums);
        case 1:
          return this.generateReview(body, people, albums, playlists);
        case 2:
          return this.generatePeopleToFollow(body, people);
      }
      
    },
    makeEvenElement: function(body, people, albums, playlists, stations) {
      switch (this.random(0, 3)) {
        case 0:
          user = _.shuffle(people)[0];
          name = user.firstName + " " + user.lastName;
          icon = this.correctIcon(user.icon);
          return this.generateGenericReleases(body, albums, name, 'Has been playing this music', '', icon);
        case 1:
          return this.generateGenericReleases(body, albums, 'New Releases', 'From artists in your collection', 'calendar', false);
        case 2:
          return this.generateGenericReleases(body, albums, 'You listened to '+ _.shuffle(albums)[0].artist, 'You might also like these albums', 'lightbulb', false);
      }
      console.error("how did this fall through?");
    },
    generatePage: function(people, albums, playlists, stations) {
      var body = $('body');
      this.generateHeavyRotation(body, albums, playlists).addClass('story');
      for (var i = 0; i < 4; ++i) {
        this.makeOddElement(body, people, albums, playlists, stations).addClass('story').addClass('odd');
        this.makeEvenElement(body, people, albums, playlists, stations).addClass('story');
      }
    },
    // ----------
    getStarted: function() {
      var self = this;

      this.log('authenticated');

      var newReleasesRequestResult;
      var topPlaylistsRequestResult;
      var stationsRequestResult;
      var followingDeferred = $.Deferred();
      var newReleasesRequestDeferred = $.Deferred();
      var topPlaylistsRequestDeferred = $.Deferred();
      var stationsRequestDeferred = $.Deferred();

      $.when(followingDeferred, newReleasesRequestDeferred, topPlaylistsRequestDeferred, stationsRequestDeferred)
        .done(function() {
          console.log("Loaded New Releases");
          var pp = self.extractPrettyPeople();
          self.generatePage(pp, newReleasesRequestResult, topPlaylistsRequestResult, stationsRequestResult);
          //var cheatEl = $('body').append("<div class='cheat-option'><sub>click here for cheat sheet</sub></div>");
          //$('body').find('.cheat-option').click(function() { printCheatSheet(); });
        })
      
      R.currentUser.trackFollowing(function() {
        self.log('got following');
        followingDeferred.resolve();
      });

      R.request({
        method: 'getTopCharts',
        content: {
          type: 'Album',
          count: 100,
          extras: ['tracks']
        },
        success: function(response) {
          self.log('got new releases');
          newReleasesRequestResult = response.result;
          newReleasesRequestDeferred.resolve();
        },
        error: function(response) {
          $(".error").text(response.message);
        }
      });

      R.request({
        method: 'getTopCharts',
        content: {
          type: 'Playlist',
          count: 100
        },
        success: function(response) {
          self.log('got top charts');
          topPlaylistsRequestResult = response.result;
          topPlaylistsRequestDeferred.resolve();
        },
        error: function(response) {
          $(".error").text(response.message);
        }
      });

      R.request({
        method: 'getStations',
        content: {
          start: 5,
          count: 20
          //'[{"field":"description","extras":["*.WEB"]},{"field":"artists","extras":["*.WEB","-*","name","url"]}]'
          //{"field":"description","extras":["*.WEB"]},{"field":"artists","extras":["*.WEB","-*","name","url"]}
        },
        success: function(response) {
          self.log('got stations');
          stationsRequestResult = _.filter(response.result, function(s) {
            return !!s.icon;
          })
          stationsRequestDeferred.resolve();
        },
        error: function(response) {
          $(".error").text(response.message);
        }
      });
    },

    // ----------
    template: function(name, config) {
      var rawTemplate = $.trim($("#" + name + "-template").text());
      var template = _.template(rawTemplate);
      var html = template(config);
      var $div = $('<div>')
        .addClass(name)
        .html(html);
      return $div;
    },

    // ----------
    log: function(message) {
      /*global console*/
      if (window.console && console.log) {
        console.log('[Music Feed] ' + message);
      }
    },

    // ----------
    // Returns a random integer between low and high, including low but not high
    random: function(low, high) {
      return low + Math.floor(Math.random() * (high - low));
    },
    correctIcon: function(iconSrc) {
      if (!iconSrc) {
        return iconSrc;
      }
      iconSrc = iconSrc.replace(/w=200&h=200/, 'w=400&h=400');
      iconSrc = iconSrc.replace(/200\.jpg/, '400.jpg');
      return iconSrc;
    }
  };

  // ----------
  $(document).ready(function() {
    Main.init();
  });

})();
