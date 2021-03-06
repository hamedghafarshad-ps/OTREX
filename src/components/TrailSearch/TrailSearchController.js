import { loadModules } from 'esri-loader';

const init = async ({ view }) => {
  const [SearchViewModel, Locator] = await loadModules([
    'esri/widgets/Search/SearchViewModel',
    'esri/tasks/Locator',
  ]);

  const vm = new SearchViewModel({
    view,
    // TODO: I turned off "By Address" in the webmap settings, but World Geocoder is still in default sources...
    includeDefaultSources: true,
    sources: [
      {
        locator: new Locator({
          url:
            'https://utility.arcgis.com/usrsvcs/servers/b34c620191be4b6f9c25576a9758bfdb/rest/services/World/GeocodeServer',
        }),
        singleLineFieldName: 'SingleLine',
        name: 'Ohio Search',
        placeholder: 'Search Ohio',
        maxResults: 3,
        maxSuggestions: 6,
        minSuggestCharacters: 0,
      },
    ],
    goToOverride: () => {
      // Don't call view.goTo()
      return null;
    },
  });

  return vm;
};

const suggest = async ({ vm, value }) => {
  // Use the SearchViewModel to get suggestions
  const suggestResponse = await vm.suggest(value);

  // Create a lookup for our sources
  const sourceNameLookup = {};
  vm.allSources.forEach((source, i) => {
    sourceNameLookup[i] = abbrevSourceName[source.name];
  });

  // Flatten results into a single array
  let allResults = [];
  suggestResponse.results.forEach(({ results }) => {
    allResults = [...allResults, ...results];
  });

  // Format results before returning to TrailSearch component
  const formattedResults = allResults.map((suggestResult) => {
    return {
      text: suggestResult.text,
      key: `${suggestResult.key}_${suggestResult.sourceIndex}`,
      source: sourceNameLookup[suggestResult.sourceIndex],
      suggestResult,
    };
  });

  return formattedResults;
};

const search = async ({ vm, value }) => {
  // Make sure the Trail Search
  // returns all fields for custom popup
  vm.allSources.forEach((source, i) => {
    if (source.layer && source.layer.title === 'Trails') {
      source.outFields = ['*'];
    }
  });
  const searchResponse = await vm.search(value);
  return searchResponse;
};

const abbrevSourceName = {
  'Trails: name': 'Trail',
  'Trailheads: name': 'Trailhead',
  'ArcGIS World Geocoding Service': 'Place',
  'Ohio Search': 'Place',
};

export { init, suggest, search };
