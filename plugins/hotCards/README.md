# Hot Cards

Hot Cards is a Stash CommunityScript plugin designed to enhance your visual experience by applying custom styling to card elements based on a Tag ID or a Rating Threshold. This plugin is perfect for highlighting certain performers or scenes and making sure you don't forget them!

## Features

- Custom styling to card elements that match a specified Tag ID or Rating Threshold.
- Enable or disable Hot Cards on various sections like home, scenes, images, movies, galleries, performers, and studios.
- Specify Hot Cards to be tag-based or rating-based for each card type, as desired.
- Customizable Hot Cards.

## Installation

1. Go to **Settings** > **Plugins**.
2. Under **Available Plugins** expand the **Community (stable)** option.
3. Search for **Hot Cards**.
4. Select the plugin and click **Install**.

## Usage

After installation, you can configure the plugin to suit your needs. Set a desired Tag ID or Rating Threshold and enable Hot Cards for the card types you want. Customize the appearance of Hot Cards for each type of card (scene, image, movie, gallery, performer, studio) using the format provided or leave the fields empty to apply the default style.

### Configure the field format:

_[criterion]\_[value]\_[style]\_[gradient-opts]\_[hover-opts]\_[card-opts]_

**Important**: If you have previously installed the plugin, after updating to `1.1.0`, be sure to update your settings from the old boolean format to the new string format. Refresh the page for the changes to take effect.

| Parameter         | Description                                                                                                                                                                                                                               | Details                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<criterion>`     | Defines the basis for applying styles. Use `t` for tag-based criteria, `r` for rating-based criteria, or `d` to disable.                                                                                                                  | If left empty, it will default to the global **Tag ID** or **Rating Threshold** configuration. If both options are enabled and unspecified, the Tag ID will be used by default.                                                                                                                                                                                                                                                                                                                     |
| `<value>`         | Specifies the exact value for the Tag ID or Rating Threshold to be used.                                                                                                                                                                  |
| `<style>`         | Defines the styling options as a comma-separated list of colors or presets. Options include: a fixed color (e.g., #5ff2a2), a Style Preset (e.g., hot), or a gradient (e.g., #ef1313,#3bd612,... with hex color codes or color names).    | Defaults to **default** (basic style preset)<br><br>Style Presets available: **default**, **hot**, **gold**.                                                                                                                                                                                                                                                                                                                                                                                        |
| `<gradient_opts>` | Specifies gradient options as a comma-separated list: `<type>,<angle>,<animation>`.</br></br> Example: **linear,35deg,4s alternate infinite** for a linear gradient with a 35-degree angle and a 4-second alternating infinite animation. | `<type>` Defaults to **linear**</br></br>Refer to [Using CSS gradients](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_images/Using_CSS_gradients) to see all types you can use.</br></br>`<angle>` Defaults to **0deg**</br></br>`<animation>` Defaults to **none**</br></br>Note that you can only configure the animation properties of the element. See [Using CSS animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations) for additional info. |
| `<hover_opts>`    | Specifies hover options as a comma-separated list: `<color>,<animation>`.</br></br>Example: **#ff0000,2s ease infinite** for a hover effect with a color of #ff0000 and a 2-second ease infinite animation.                               | `<color>` Defaults to **transparent**</br></br>`<animation>` Defaults to **none**</br></br>Similar to the gradient animation, you can only configure the animation properties of the element.                                                                                                                                                                                                                                                                                                       |
| `<card_opts>`     | Specifies the general options for the card as a comma-separated list: `<fill>,<opacity>`.                                                                                                                                                 | `fill` Defaults to **true**<br>_Indicates whether the card should be filled._</br></br>Tip: You can set this to **false** to color only the border of the card.</br></br>`opacity` Defaults to **80**<br>_Represents the opacity for the card background. Range from 0 to 100._                                                                                                                                                                                                                     |

<br />

**Note**: _It is recommended to refresh the page once you are done configuring for the changes to take effect and the previous style to be overwritten._

## Examples

**Style Preset**:

`t_123_gold`

| Segment       | Value | Meaning            |
| ------------- | ----- | ------------------ |
| criterion     | t     | Tag-based          |
| value         | 123   | Use 123 as Tag ID  |
| style         | gold  | Use Gold preset    |
| gradient-opts |       | No gradient        |
| hover-opts    |       | No hover effect    |
| card-opts     |       | Use default values |

---

**Modify an existing Style Preset**:

`__hot_,,none_pink,none`

| Segment       | Value     | Meaning                                    |
| ------------- | --------- | ------------------------------------------ |
| criterion     |           | Use tag or rating as configured            |
| value         |           | Use global tag or rating value             |
| style         | hot       | Use Hot preset                             |
| gradient-opts | ,,none    | No gradient animation                      |
| hover-opts    | pink,none | Set hover effect color, no hover animation |
| card-opts     |           | Use default values                         |

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

**Fixed Color border-only**

`r_4_white___false`

| Segment       | Value | Meaning                   |
| ------------- | ----- | ------------------------- |
| criterion     | r     | Rating-based              |
| value         | 4     | Use 4 as Rating Threshold |
| style         | white | Set fixed color           |
| gradient-opts |       | No gradient               |
| hover-opts    |       | No hover effect           |
| card-opts     | false | No fill                   |

---

**Fixed Color with hover effect**

`__#5ff2a2__#5ff1a1`

| Segment       | Value   | Meaning                         |
| ------------- | ------- | ------------------------------- |
| criterion     |         | Use tag or rating as configured |
| value         |         | Use global tag or rating value  |
| style         | #5ff2a2 | Set fixed color                 |
| gradient-opts |         | No gradient                     |
| hover-opts    | #5ff1a1 | Set hover color                 |
| card-opts     |         | Use default values              |

---

**Gradient with hover effect**

`_67_pink,red,yellow,green,red,blue_,30deg,5s ease infinite_red,1s ease-in-out infinite`

| Segment       | Value                          | Meaning                                   |
| ------------- | ------------------------------ | ----------------------------------------- |
| criterion     |                                | Use tag or rating as configured           |
| value         | 67                             | Use 67 as Tag ID or Rating Threshold      |
| style         | pink,red,yellow,green,red,blue | Use gradient                              |
| gradient-opts | ,30deg,5s ease infinite        | Specify angle, and animate gradient       |
| hover-opts    | red,1s ease-in-out infinite    | Set hover effect color, and animate hover |
| card-opts     | ,100                           | Use max opacity                           |

**Note**: _You can also skip inner values, notice the first comma in **gradient-opts**. The type is not provided, so linear gradient will be used by default._

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
