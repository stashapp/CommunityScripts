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

_[criterion]\_[value]\_[style]\_[gradient-opts]\_[border-opts]_

**Important**: If you have previously installed the plugin, after updating to `1.1.0`, be sure to update your settings from the old boolean format to the new string format. Refresh the page for the changes to take effect.

| Parameter         | Description                                                                                                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<criterion>`     | Defines the basis for applying styles. Use `t` for tag-based criteria, `r` for rating-based criteria, or `d` to disable. If left empty, it will default to the global Tag ID or Rating Threshold configuration. If both options are enabled and unspecified, the Tag ID will be used by default. |
| `<value>`         | Specifies the exact value for the Tag ID or Rating Threshold to be used.                                                                                                                                                                                                                         |
| `<style>`         | Defines the styling options as a comma-separated list of colors or presets. Options include: a fixed color (e.g., #5ff2a2), a style preset (e.g., hot), or a gradient (e.g., #ef1313,#3bd612,... with hex color codes or color names).                                                           |
| `<gradient-opts>` | Specifies gradient options as a comma-separated list: `<gradient type>,<gradient angle>,<gradient animation>`. Example: **linear,35deg,4s alternate infinite** for a linear gradient with a 35-degree angle and a 4-second alternating infinite animation.                                       |
| `<border-opts>`   | Specifies border options as a comma-separated list: `<border color>,<border animation>`. Example: **#ff0000,2s ease infinite** for a border with a color of #ff0000 and a 2-second ease infinite animation.                                                                                      |

<br />

**Note**: _It is recommended to refresh the page once you are done configuring for the changes to take effect and the previous style to be overwritten._

## Examples

**Style Preset**:

`t_123_gold`

| Segment       | Value | Meaning           |
| ------------- | ----- | ----------------- |
| criterion     | t     | Tag-based         |
| value         | 123   | Use 123 as Tag ID |
| style         | gold  | Use Gold preset   |
| gradient-opts |       | No gradient       |
| border-opts   |       | No border         |

---

**Modify an existing Style Preset**:

`__hot_,,none_pink,none`

| Segment       | Value     | Meaning                               |
| ------------- | --------- | ------------------------------------- |
| criterion     |           | Use tag or rating as configured       |
| value         |           | Use tag or rating global value        |
| style         | hot       | Use Hot preset                        |
| gradient-opts | ,,none    | No gradient animation                 |
| border-opts   | pink,none | Set border color, no border animation |

---

**Fixed Color**

`r__#2673b8`

| Segment       | Value   | Meaning                 |
| ------------- | ------- | ----------------------- |
| criterion     | r       | Rating-based            |
| value         |         | Use rating global value |
| style         | #2673b8 | Set fixed color         |
| gradient-opts |         | No gradient             |
| border-opts   |         | No border               |

---

**Fixed Color with Border**

`__#5ff2a2__#5ff1a1`

| Segment       | Value   | Meaning                              |
| ------------- | ------- | ------------------------------------ |
| criterion     |         | Use tag or rating as configured      |
| value         |         | Use tag or rating global value       |
| style         | #5ff2a2 | Set fixed color                      |
| gradient-opts |         | No gradient                          |
| border-opts   | #5ff1a1 | Set border color when hovering cards |

---

**Gradient with Border**

`_67_pink,red,yellow,green,red,blue_,30deg,5s ease infinite_red,1s ease-in-out infinite`

| Segment       | Value                          | Meaning                              |
| ------------- | ------------------------------ | ------------------------------------ |
| criterion     |                                | Use tag or rating as configured      |
| value         | 67                             | Use 67 as Tag ID or Rating Threshold |
| style         | pink,red,yellow,green,red,blue | Make gradient                        |
| gradient-opts | ,30deg,5s ease infinite        | Specify angle and animate gradient   |
| border-opts   | red,1s ease-in-out infinite    | Set border color and animate border  |

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
