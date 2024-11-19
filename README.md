# 🌟 **Html2Media Filament Action Documentation** 📄

**Html2Media** is a powerful Laravel Filament package that allows you to generate PDFs, preview documents, and directly print content from your application. 🚀

---

## 📌 **Overview**

The **Html2MediaAction** provides a set of flexible actions for your Filament resources, enabling:

- 📑 **PDF Generation**: Convert HTML to a PDF and download it.
- 🖨️ **Direct Printing**: Print HTML content directly from the application.
- 👀 **Document Preview**: Preview the content in a modal before printing or exporting.

---

## ✨ **Features**

- 🎨 **Customizable File Naming**: Define a custom name for the generated PDF.
- 🔍 **Preview & Print Options**: Preview the content before printing or saving as a PDF.
- 📏 **Page Configuration**: Adjust page orientation, size, margins, and scaling.
- 🛠️ **Advanced PDF Options**: Control page breaks, hyperlink inclusion, and more.

---

## 🔧 **Installation**

To install the package, simply run the following command:

```bash
composer require torgodly/html2media
```

Once installed, the **Html2MediaAction** can be used within your Filament resources or tables.

---

## ⚙️ **Configuration Methods**

Here’s how you can customize your **Html2MediaAction**!

### 1. 📂 `filename()`

Set the name of the generated PDF file. ✍️

**Usage**:

```php
Html2MediaAction::make('print')
    ->filename('my-custom-document')
```

- 🏷️ **Default**: `'document.pdf'`
- 🔠 **Accepts**: `string` or `Closure`

---

### 2. 📄 `pagebreak()`

Define page break behavior. Customize how and where page breaks occur within the document. 🛑

**Usage**:

```php
Html2MediaAction::make('print')
    ->pagebreak('section', ['css', 'legacy'])
```

- 🔄 **Default**: `['mode' => ['css', 'legacy'], 'after' => 'section']`
- 🛠️ **Accepts**:
  - `mode`: Array of strings (`['avoid-all', 'css', 'legacy']`)
  - `after`: Element ID, class, tag, or `*` for all elements.
  - `avoid`: (Optional) Element ID, class, or tag to avoid page breaks.

- 📖 **More info on page breaks**: [here](https://ekoopmans.github.io/html2pdf.js/#page-breaks).

---

### 3. 🔄 `orientation()`

Set the page orientation for the PDF, either **portrait** or **landscape**. 🖼️

**Usage**:

```php
Html2MediaAction::make('print')
    ->orientation('landscape')
```

- 🏷️ **Default**: `'portrait'`
- 🔠 **Accepts**: `string` (`'portrait'`, `'landscape'`) or `Closure`

---

### 4. 📐 `format()`

Define the format of the PDF, including standard sizes like A4 or custom dimensions. 📏

**Usage**:

```php
Html2MediaAction::make('print')
    ->format('letter', 'in')
```

- 🏷️ **Default**: `'a4'`
- 🔠 **Accepts**: `string`, `array` (e.g., `[width, height]`), or `Closure`

---

### 5. 🔗 `enableLinks()`

Enable or disable automatic hyperlink conversion in the PDF. 🔗

**Usage**:

```php
Html2MediaAction::make('print')
    ->enableLinks()
```

- 🏷️ **Default**: `false`
- 🔠 **Accepts**: `bool` or `Closure`

---

### 6. 🔧 `scale()`

Adjust the scaling factor for HTML to PDF conversion. 🔍

**Usage**:

```php
Html2MediaAction::make('print')
    ->scale(2)
```

- 🏷️ **Default**: `2`
- 🔠 **Accepts**: `int` or `Closure`

---

### 7. 🖨️ `print()`

Enable or disable the print button in the modal. 🖨️

**Usage**:

```php
Html2MediaAction::make('print')
    ->print(true)
```

- 🏷️ **Default**: `true`
- 🔠 **Accepts**: `bool` or `Closure`

---

### 8. 👁️ `preview()`

Enable a preview option for the document content before printing or saving. 👀

**Usage**:

```php
Html2MediaAction::make('print')
    ->preview()
```

- 🏷️ **Default**: `false`
- 🔠 **Accepts**: `bool` or `Closure`

---

### 9. 💾 `savePdf()`

Enable the option to directly save the content as a PDF. 💾

**Usage**:

```php
Html2MediaAction::make('print')
    ->savePdf()
```

- 🏷️ **Default**: `false`
- 🔠 **Accepts**: `bool` or `Closure`

---

### 10. ✅ `requiresConfirmation()`

Show a confirmation modal before performing the action. 🛑

**Usage**:

```php
Html2MediaAction::make('print')
    ->requiresConfirmation()
```

- 🏷️ **Default**: `true`
- 🔠 **Accepts**: `bool` or `Closure`

---

### 11. 💻 `content()`

Set the content for the document. Typically, you’ll pass a Blade view for the content. 📝

**Usage**:

```php
Html2MediaAction::make('print')
    ->content(fn($record) => view('invoice', ['record' => $record]))
```

- 🔠 **Accepts**: `View`, `Htmlable`, or `Closure`

---

## 🎨 **Example Usage**

Here’s a complete example of configuring the **Html2MediaAction**:

```php
Html2MediaAction::make('print')
    ->scale(2)
    ->print() // Enable print option
    ->preview() // Enable preview option
    ->filename('invoice') // Custom file name
    ->savePdf() // Enable save as PDF option
    ->requiresConfirmation() // Show confirmation modal
    ->pagebreak('section', ['css', 'legacy'])
    ->orientation('portrait') // Portrait orientation
    ->format('a4', 'mm') // A4 format with mm units
    ->enableLinks() // Enable links in PDF
    ->margin([0, 50, 0, 50]) // Set custom margins
    ->content(fn($record) => view('invoice', ['record' => $record])) // Set content
```

This configuration will:

- 📄 Generate a PDF from the `invoice` Blade view.
- 🖨️ Allow users to `preview` and `print` the document.
- 💾 Enable `saving as PDF` and show a confirmation modal before executing.
- 📏 Set A4 format with portrait orientation.
- 🔗 Enable links and set custom margins.

---

## 📊 **Filament Action or Table Action**

You can use the **Html2MediaAction** in the same way, whether it's in a Filament table action or a regular action. Simply import the appropriate class:

```php
use Torgodly\Html2Media\Actions\Html2MediaAction;
use Torgodly\Html2Media\Tables\Actions\Html2MediaAction;
```

This makes the action flexible and usable in various contexts. 🌍

---

## ⚡ **Quick Example: Direct Print or Save as PDF**

1. **For direct printing**:

```php
Html2MediaAction::make('print')
    ->content(fn($record) => view('invoice', ['record' => $record]))
```

This will directly open the print dialog for the HTML content. 🖨️

2. **For saving as PDF**:

```php
Html2MediaAction::make('print')
    ->savePdf()
    ->content(fn($record) => view('invoice', ['record' => $record]))
```

This will save the HTML content as a PDF. 💾

---

## 🏁 **Conclusion**

The **Html2Media** package for Filament makes it easy to generate PDFs, preview documents, and print content directly from your Laravel app. With flexible configuration options, you can tailor it to your specific needs, ensuring smooth document handling. ✨

We hope this documentation helps you get started quickly. 🚀 Happy coding! 🎉

