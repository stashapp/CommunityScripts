# GraphQL examples

Every query the plugin uses, copy-pasteable into the Stash GraphQL playground at `http://<your-stash>/playground`.

> Tip: if your Stash install requires an API key, click the cog icon in the playground, switch to **HTTP HEADERS**, and add:
>
> ```json
> { "ApiKey": "your-api-key-here" }
> ```

## 1. Library-wide totals

The dashboard's KPI strip.

```graphql
query MetricsStats {
  stats {
    scene_count
    scenes_size
    scenes_duration
    image_count
    images_size
    gallery_count
    performer_count
    studio_count
    movie_count
    tag_count
    total_o_count
    total_play_duration
  }
}
```

## 2. All performers (paginated)

Full performer field set. Page in chunks of 250.

```graphql
query PageOfPerformers($filter: FindFilterType) {
  findPerformers(filter: $filter) {
    count
    performers {
      id
      name
      disambiguation
      gender
      country
      ethnicity
      eye_color
      hair_color
      height_cm
      weight
      measurements
      fake_tits
      tattoos
      piercings
      career_length
      birthdate
      death_date
      favorite
      rating100
      ignore_auto_tag
      scene_count
      image_count
      gallery_count
      o_counter
      tags { id name }
    }
  }
}
```

Variables:

```json
{ "filter": { "per_page": 250, "page": 1, "sort": "name", "direction": "ASC" } }
```

## 3. All scenes (paginated)

The plugin's heaviest fetch; tag co-occurrence, time series, storage and resolution charts all read from this.

```graphql
query PageOfScenes($filter: FindFilterType) {
  findScenes(filter: $filter) {
    count
    scenes {
      id
      title
      date
      rating100
      o_counter
      play_count
      organized
      studio { id name }
      performers { id name gender }
      tags { id name }
      files {
        size
        duration
        width
        height
        video_codec
        audio_codec
        frame_rate
        bit_rate
      }
    }
  }
}
```

```json
{ "filter": { "per_page": 250, "page": 1, "sort": "date", "direction": "ASC" } }
```

## 4. All tags (paginated)

For the tag hierarchy view.

```graphql
query PageOfTags($filter: FindFilterType) {
  findTags(filter: $filter) {
    count
    tags {
      id
      name
      description
      parents  { id name }
      children { id name }
      scene_count
      performer_count
      image_count
      gallery_count
    }
  }
}
```

```json
{ "filter": { "per_page": 500, "page": 1, "sort": "name", "direction": "ASC" } }
```

## 5. All studios

For the storage-by-studio doughnut and the studio×tag heatmap.

```graphql
query PageOfStudios($filter: FindFilterType) {
  findStudios(filter: $filter) {
    count
    studios {
      id
      name
      parent_studio { id name }
      scene_count
      performer_count
      rating100
      favorite
    }
  }
}
```

```json
{ "filter": { "per_page": 500, "page": 1 } }
```

## 6. Custom drill-downs

Once the dashboard has surfaced an interesting tag or performer pair, you'll usually want to drill into the underlying scenes. Examples:

### Find every scene tagged "Outdoor" featuring a US-born performer

```graphql
query OutdoorUSPerformers {
  findScenes(
    scene_filter: {
      tags: { value: ["1"], modifier: INCLUDES_ALL }
      performers: { value: ["42"], modifier: INCLUDES }
    }
    filter: { per_page: 50, page: 1, sort: "date", direction: "DESC" }
  ) {
    count
    scenes { id title date }
  }
}
```

(Use the IDs the dashboard exposes in its rankings — every ranking entry includes `id`.)

### Performers with no tags assigned

```graphql
query Untagged {
  findPerformers(
    performer_filter: { tag_count: { value: 0, modifier: EQUALS } }
    filter: { per_page: 100, page: 1 }
  ) {
    count
    performers { id name }
  }
}
```

### Scenes longer than two hours

```graphql
query LongScenes {
  findScenes(
    scene_filter: { duration: { value: 7200, modifier: GREATER_THAN } }
    filter: { per_page: 50, page: 1, sort: "duration", direction: "DESC" }
  ) {
    count
    scenes { id title date files { duration } }
  }
}
```

---

The pagination loop in `src/data/graphql.js` (browser) and `backend/stash_client.js` (Node) walks `findX` queries until the running total catches `count`. Either side will emit `[metrics] performers: 5230/25000` style progress on stderr.
