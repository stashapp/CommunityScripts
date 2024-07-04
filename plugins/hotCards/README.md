# Hot Cards

Hot Cards is a Stash CommunityScript plugin designed to enhance your visual experience by applying custom styling to card elements based on a Tag ID or a Rating Threshold. This plugin is perfect for highlighting certain performers, scenes, studios, movies, images, or galleries.

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

### Custom String Format:

_[criterion]\_[value]\_[style]\_[gradient-opts]\_[border-opts]_

**Important**: If you have previously installed the plugin, after updating to `1.1.0`, be sure to update your settings from the old boolean format to the new string format. Refresh the page for the changes to take effect.

1. **criterion**: `<criterion>`

   `t` for tag-based, `r` for rating-based,`d` for disabled. You can also leave it `<empty>` and it will grab the global value of the _Tag ID_ or _Rating Threshold_ as configured.

2. **value**: `<value>`

   Specific value for Tag ID or Rating Threshold.

3. **style**: `<color, color, color, ...>` (comma separated)

   - Fixed color: **#5ff2a2**
   - Style preset: **hot**
   - Gradient: **#ef1313,#3bd612,...** (Hex color codes, color names)

4. **gradient_opts**: `<gradient type>,<gradient angle>,<gradient animation>` (comma separated)

   Example: **linear,35deg,4s alternate infinite**

5. **border_opts**: `<border color>,<border animation>` (comma separated)

   Example: **#ff0000,2s ease infinite**

<br />

**Note**: _It is recommended to refresh the page once you are done configuring for the changes to take effect and the previous style to be rewritten._

## Examples

**Style Preset**:

t_123_gold

| Segment       | Value |      Meaning      |
| ------------- | :---: | :---------------: |
| criterion     |   t   |     tag-based     |
| value         |  123  | use 123 as Tag ID |
| style         | gold  |  use gold preset  |
| gradient_opts |       |        N/A        |
| border_opts   |       |        N/A        |

---

**Fixed Color**

r\_\_#2673b8

| Segment       |  Value  |            Meaning            |
| ------------- | :-----: | :---------------------------: |
| criterion     |    r    |         rating-based          |
| value         |         | use rating-based global value |
| style         | #2673b8 |        use fixed color        |
| gradient_opts |         |              N/A              |
| border_opts   |         |              N/A              |

---

**Fixed Color with Border**

\_\_#5ff2a2\_\_#5ff1a1

| Segment       |  Value  |                   Meaning                    |
| ------------- | :-----: | :------------------------------------------: |
| criterion     |         | use tag-based or rating-based global enabled |
| value         |         |  use tag-based or rating-based global value  |
| style         | #5ff2a2 |               use fixed color                |
| gradient_opts |         |                     N/A                      |
| border_opts   | #5ff1a1 |     use border color when hovering cards     |

---

**Gradient with Border**

\_67_pink,red,yellow,green,red,blue\_,30deg,5s ease infinite_red,1s ease-in-out infinite

| Segment       |             Value              |                   Meaning                    |
| ------------- | :----------------------------: | :------------------------------------------: |
| criterion     |                                | use tag-based or rating-based global enabled |
| value         |               67               |     use 67 as Tag ID or Rating Threshold     |
| style         | pink,red,yellow,green,red,blue |                 use gradient                 |
| gradient_opts |    ,30deg,5s ease infinite     |  type not provided, use linear per default   |
| border_opts   |  red,1s ease-in-out infinite   |

## Style Presets

These presets provide predefined styles for quick and easy customization.

### default

You can specify '\_\_default' for the card type you want the **default** preset to be applied and it will use the globally configured Tag ID or Rating Threshold. You can also leave the field empty and the default style will be applied anyway.

### hot

You can specify '\_\_hot' for the card type you want the **hot** preset to be applied and it will use the globally configured Tag ID or Rating Threshold.

### gold

You can specify '\_\_gold' for the card type you want the **gold** preset to be applied and it will use the globally configured Tag ID or Rating Threshold.
