# Hot Cards

Hot Cards is a Stash CommunityScript plugin designed to enhance your visual experience by applying custom styling to card elements based on a Tag ID or a Rating Threshold. This plugin is perfect for highlighting certain performers or scenes and making sure you don't forget them!

## Features

- Custom styling to card elements that match a specified Tag ID or Rating Threshold.
- Enable or disable Hot Cards on various sections like home, scenes, images, movies, galleries, performers, and studios.
- Specify Hot Cards to be tag-based or rating-based for each card type, as desired.
- Customizable Hot Cards.
- Support for multi-tag and multi-style configurations.

## Installation

1. Go to **Settings** > **Plugins**.
2. Under **Available Plugins** expand the **Community (stable)** option.
3. Search for **Hot Cards**.
4. Select the plugin and click **Install**.

## Usage

After installation, you can configure the plugin to suit your needs. Set a desired Tag ID or Rating Threshold and enable Hot Cards for the card types you want. Customize the appearance of Hot Cards for each type of card (scene, image, movie, gallery, performer, studio) using the format provided or leave the fields empty to apply the default style.

### Configure the field format:

_[criterion]\_[value]\_[style]\_[gradient-opts]\_[hover-opts]\_[card-opts]_

| Parameter         | Description                                                                                                                                                                                                                                                                                                                                                                       | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<criterion>`     | Defines the basis for applying styles. Use `t` for tag-based criteria, `r` for rating-based criteria, or `d` to disable.                                                                                                                                                                                                                                                          | If left empty, it will default to the global _Tag ID_ or _Rating Threshold_ as configured. If both options are enabled and unspecified, ~~the Tag ID will be used by default~~ both criteria will be used.                                                                                                                                                                                                                                                                                                 |
| `<value>`         | Specifies the exact value for the Tag ID or Rating Threshold to be used.<br><br>_Multiple values can be specified using a comma-separated list and slashes to delimit each set of criteria:_ `<tag_id>,.../<tag_id>,.../...` or `<rating>/<rating>/...`                                                                                                                           | **Important**: When dealing with tenths precision (e.g. 4.8, 3.25), map these to the 6-100 range and set the _Rating Threshold_ in that range. Thus, 4.8 would be 96, 3.25 would be 65, and so on.<br><br>See [this additional information](#regarding-multiple-values) on multiple values.                                                                                                                                                                                                                |
| `<style>`         | Defines the styling options as a comma-separated list of colors or a style preset.</br></br>Options include: a fixed color (e.g., #5ff2a2), a style preset (e.g., hot), or a gradient (e.g., #ef1313,#3bd612,... hex color codes or color names).<br><br>_A style can be specified for each set of values using a slash-separated list:_ `<style>/<style>/...`                    | Defaults to **default** (basic style preset)<br><br>Style Presets available: **default**, **hot**, **gold**.                                                                                                                                                                                                                                                                                                                                                                                               |
| `<gradient_opts>` | Specifies gradient options as a comma-separated list: `<type>,<angle>,<animation>`.</br></br> Example: **linear,35deg,4s alternate infinite** for a linear gradient with a 35-degree angle and a 4-second alternating infinite animation.</br></br>_Gradient options can be specified for each set of values using a slash-separated list:_ `<gradient_opts>/<gradient_opts>/...` | `<type>` Defaults to **linear**</br></br>Refer to [Using CSS gradients](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_images/Using_CSS_gradients) to see all types you can use.</br></br>`<angle>` Defaults to **0deg**</br></br>`<animation>` Defaults to **none**</br></br>Note that you can only configure the animation properties of the element. See [Using CSS animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations) for additional information. |
| `<hover_opts>`    | Specifies hover options as a comma-separated list: `<color>,<animation>`.</br></br>Example: **#ff0000,2s ease infinite** for a hover effect with a color of #ff0000 and a 2-second ease infinite animation.</br></br>_Hover options can be specified for each set of values using a slash-separated list:_ `<hover_opts>/<hover_opts>/...`                                        | `<color>` Defaults to **transparent**</br></br>`<animation>` Defaults to **none**</br></br>Similar to the gradient animation, you can only configure the animation properties of the element.                                                                                                                                                                                                                                                                                                              |
| `<card_opts>`     | Specifies the general options for the card as a comma-separated list: `<fill>,<opacity>`.</br></br>_Card options can be specified for each set of values using a slash-separated list:_ `<card_opts>/<card_opts>/...`                                                                                                                                                             | `fill` Defaults to **true**<br>_Indicates whether the card should be filled._</br></br>Tip: You can set this to **false** to color only the border of the card.</br></br>`opacity` Defaults to **80**<br>_Represents the opacity for the card background. Range from 0 to 100._                                                                                                                                                                                                                            |

<br>

**Note**: _It is recommended to refresh the page once you are done configuring for the changes to take effect and the previous style to be overwritten._

#### Regarding multiple values

The first matching condition found is applied, and subsequent matches are ignored. This ensures the highest priority condition takes precedence based on the left-to-right order of your declarations.

1. **Tag IDs**

Corresponding styles _(style, gradient_opts, hover_opts, card_opts)_ are applied only if **ALL** tags in a set match.

The tags are prioritized from **left to right**, meaning if it finds a match for a tag list, the corresponding style is applied and subsequent sets that may also match are ignored.

For example:

`t_201,202/202_red/blue`

- A card with tags 201 and 202 will be painted red.
- A card with tag 202 will be painted blue (only if it does not have tag 201).

Conversely, `t_202/201,202_blue/red`

- A card with tag 202 will be painted blue, regardless of the presence of tag 201. Therefore, there will be no cards painted red.

<br>

2. **Ratings**

The same left-to-right prioritization applies.

Consider the declaration:

`r_4/2_red/blue`

- In this case, red applies for ratings >= 4, and blue for ratings >= 2 but less than 4.

<br>

Multiple ratings are also supported, although it may not be very useful:

`r_2,4_blue`

- Targets cards with exact ratings of 4 or 2. Here the order does not matter.

## Examples

**Style Preset**:

`t_123_gold`

| Segment       | Value | Meaning                |
| ------------- | ----- | ---------------------- |
| criterion     | t     | Tag-based              |
| value         | 123   | Use 123 as Tag ID      |
| style         | gold  | Use Gold preset        |
| gradient-opts |       | Use Gold gradient opts |
| hover-opts    |       | Use Gold hover opts    |
| card-opts     |       | Use default values     |

---

**Modify an existing Style Preset**:

`__hot_,,none_pink,none_,40`

| Segment       | Value     | Meaning                                    |
| ------------- | --------- | ------------------------------------------ |
| criterion     |           | Use tag or rating as configured            |
| value         |           | Use global tag or rating value             |
| style         | hot       | Use Hot preset                             |
| gradient-opts | ,,none    | No gradient animation                      |
| hover-opts    | pink,none | Set hover effect color, no hover animation |
| card-opts     | ,40       | Set opacity to 40                          |

---

**Fixed Color**

`r__#2673b8`

| Segment       | Value   | Meaning                 |
| ------------- | ------- | ----------------------- |
| criterion     | r       | Rating-based            |
| value         |         | Use global rating value |
| style         | #2673b8 | Set fixed color         |
| gradient-opts |         | No gradient             |
| hover-opts    |         | No hover effect         |
| card-opts     |         | Use default values      |

---

**Fixed Color border-only with hover effect**

`r_4_white__#5ff1a1_false`

| Segment       | Value   | Meaning                   |
| ------------- | ------- | ------------------------- |
| criterion     | r       | Rating-based              |
| value         | 4       | Use 4 as Rating Threshold |
| style         | white   | Set fixed color           |
| gradient-opts |         | No gradient               |
| hover-opts    | #5ff1a1 | Set hover color           |
| card-opts     | false   | No fill                   |

---

**Animated gradient with animated hover effect**

`_67_pink,red,yellow,green,red,blue_,30deg,5s ease infinite_red,1s ease-in-out infinite_,100`

| Segment       | Value                          | Meaning                                   |
| ------------- | ------------------------------ | ----------------------------------------- |
| criterion     |                                | Use tag or rating as configured           |
| value         | 67                             | Use 67 as Tag ID or Rating Threshold      |
| style         | pink,red,yellow,green,red,blue | Apply gradient                            |
| gradient-opts | ,30deg,5s ease infinite        | Specify angle, and animate gradient       |
| hover-opts    | red,1s ease-in-out infinite    | Set hover effect color, and animate hover |
| card-opts     | ,100                           | Use max opacity                           |

**Note**: _You can also skip inner values, notice the first comma in **gradient-opts**. The type is not provided, so linear gradient will be used by default._

---

**Multi-tag**

`t_111,116,78,87_blue__green`

| Segment       | Value         | Meaning                   |
| ------------- | ------------- | ------------------------- |
| criterion     | t             | Tag-based                 |
| value         | 111,116,78,87 | Use tags 111, 116, 78, 87 |
| style         | blue          | Set fixed color           |
| gradient-opts |               | No animation              |
| hover-opts    | green         | Set hover effect color    |
| card-opts     |               | Use default values        |

---

**Multi-tag with multi-style**

`t_111,116,78,87/105_pink,red,white/orange,white_/,70deg,4s alternate infinite__,30/`

| Segment       | Value                         | Meaning                                                                          |
| ------------- | ----------------------------- | -------------------------------------------------------------------------------- |
| criterion     | t                             | Tag-based                                                                        |
| value         | 111,116,78,87/105             | Use tags 111, 116, 78, 87 or 105                                                 |
| style         | pink,red,white/orange,white   | Apply pink, red, white gradient for first set of tags; orange, white for tag 105 |
| gradient-opts | /,70deg,4s alternate infinite | No animation for first set of tags; 70deg, 4s alternate infinite for tag 105     |
| hover-opts    |                               | Use default hover options                                                        |
| card-opts     | ,30/                          | Set opacity to 30 for first set of tags; default opacity for tag 105             |

---

**Rating with multi-style**

`r_5/4/3_gold/hot/default___//,50`

| Segment       | Value            | Meaning                                                                               |
| ------------- | ---------------- | ------------------------------------------------------------------------------------- |
| criterion     | r                | Rating-based                                                                          |
| value         | 5/4/3            | Use ratings 5, 4, and 3                                                               |
| style         | gold/hot/default | Apply gold style to ratings 5, hot style to ratings 4, and default style to ratings 3 |
| gradient-opts |                  | Use default gradient options                                                          |
| hover-opts    |                  | Use default hover options                                                             |
| card-opts     | //,50            | Set opacity to 50 for ratings 3; default opacity to other ratings                     |

---

**Multi-rating (tenth) with multi-style**

`r_96,90,88/70,60_#0fff00/#000cff`

| Segment       | Value           | Meaning                                                                    |
| ------------- | --------------- | -------------------------------------------------------------------------- |
| criterion     | r               | Rating-based                                                               |
| value         | 96,90,88/70,60  | Use ratings 96, 90, 88 or 70, 60                                           |
| style         | #0fff00/#000cff | Apply #0fff00 color to ratings 96, 90, 88; #000cff color to ratings 70, 60 |
| gradient-opts |                 | Use default gradient options                                               |
| hover-opts    |                 | Use default hover options                                                  |
| card-opts     |                 | Use default card options                                                   |

## Style Presets

These presets provide predefined styles for quick and easy customization.

### Default

![Default](/plugins/hotCards/assets/default.png)

You can specify '\_\_default' for the card type you want the **default** preset to be applied and it will use the configured Tag ID or Rating Threshold. You can also leave the field empty and the default style will be applied anyway.

### Hot

![Hot](/plugins/hotCards/assets/hot.png)

You can specify '\_\_hot' for the card type you want the **hot** preset to be applied and it will use the configured Tag ID or Rating Threshold.

### Gold

![Gold](/plugins/hotCards/assets/gold.png)

You can specify '\_\_gold' for the card type you want the **gold** preset to be applied and it will use the configured Tag ID or Rating Threshold.
