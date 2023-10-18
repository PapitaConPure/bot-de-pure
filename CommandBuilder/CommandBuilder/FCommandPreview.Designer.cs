
namespace CommandBuilder {
	partial class FCommandPreview {
		/// <summary>
		/// Required designer variable.
		/// </summary>
		private System.ComponentModel.IContainer components = null;

		/// <summary>
		/// Clean up any resources being used.
		/// </summary>
		/// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
		protected override void Dispose(bool disposing) {
			if(disposing && (components != null)) {
				components.Dispose();
			}
			base.Dispose(disposing);
		}

		#region Windows Form Designer generated code

		/// <summary>
		/// Required method for Designer support - do not modify
		/// the contents of this method with the code editor.
		/// </summary>
		private void InitializeComponent() {
			this.components = new System.ComponentModel.Container();
			System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(FCommandPreview));
			this.pnlTítulo = new System.Windows.Forms.Panel();
			this.lblFlavor = new System.Windows.Forms.Label();
			this.lblTítulo = new System.Windows.Forms.Label();
			this.pnlContent = new System.Windows.Forms.Panel();
			this.tbCódigo = new FastColoredTextBoxNS.FastColoredTextBox();
			this.pnlOpciones = new System.Windows.Forms.Panel();
			this.btnAgregar = new ControLib.SleekButton();
			this.btnCancelar = new ControLib.SleekButton();
			this.pnlTítulo.SuspendLayout();
			this.pnlContent.SuspendLayout();
			((System.ComponentModel.ISupportInitialize)(this.tbCódigo)).BeginInit();
			this.pnlOpciones.SuspendLayout();
			this.SuspendLayout();
			// 
			// pnlTítulo
			// 
			this.pnlTítulo.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(12)))), ((int)(((byte)(12)))), ((int)(((byte)(12)))));
			this.pnlTítulo.Controls.Add(this.lblFlavor);
			this.pnlTítulo.Controls.Add(this.lblTítulo);
			this.pnlTítulo.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlTítulo.Location = new System.Drawing.Point(0, 0);
			this.pnlTítulo.Name = "pnlTítulo";
			this.pnlTítulo.Padding = new System.Windows.Forms.Padding(0, 2, 0, 2);
			this.pnlTítulo.Size = new System.Drawing.Size(981, 49);
			this.pnlTítulo.TabIndex = 10;
			// 
			// lblFlavor
			// 
			this.lblFlavor.Dock = System.Windows.Forms.DockStyle.Fill;
			this.lblFlavor.Font = new System.Drawing.Font("Lucida Fax", 12F, ((System.Drawing.FontStyle)((System.Drawing.FontStyle.Bold | System.Drawing.FontStyle.Italic))));
			this.lblFlavor.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.lblFlavor.Location = new System.Drawing.Point(413, 2);
			this.lblFlavor.Name = "lblFlavor";
			this.lblFlavor.Padding = new System.Windows.Forms.Padding(0, 0, 6, 8);
			this.lblFlavor.Size = new System.Drawing.Size(568, 45);
			this.lblFlavor.TabIndex = 6;
			this.lblFlavor.Text = "El comando fue generado con éxito. Esperando confirmación...";
			this.lblFlavor.TextAlign = System.Drawing.ContentAlignment.BottomRight;
			// 
			// lblTítulo
			// 
			this.lblTítulo.AutoSize = true;
			this.lblTítulo.Dock = System.Windows.Forms.DockStyle.Left;
			this.lblTítulo.Font = new System.Drawing.Font("Segoe UI Black", 24F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.lblTítulo.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(231)))), ((int)(((byte)(78)))), ((int)(((byte)(39)))));
			this.lblTítulo.Location = new System.Drawing.Point(0, 2);
			this.lblTítulo.Name = "lblTítulo";
			this.lblTítulo.Size = new System.Drawing.Size(413, 45);
			this.lblTítulo.TabIndex = 5;
			this.lblTítulo.Text = "Vista Previa de Comando";
			// 
			// pnlContent
			// 
			this.pnlContent.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(62)))), ((int)(((byte)(60)))), ((int)(((byte)(68)))));
			this.pnlContent.Controls.Add(this.tbCódigo);
			this.pnlContent.Dock = System.Windows.Forms.DockStyle.Fill;
			this.pnlContent.Location = new System.Drawing.Point(0, 49);
			this.pnlContent.Name = "pnlContent";
			this.pnlContent.Padding = new System.Windows.Forms.Padding(12, 8, 12, 8);
			this.pnlContent.Size = new System.Drawing.Size(981, 539);
			this.pnlContent.TabIndex = 1;
			// 
			// tbCódigo
			// 
			this.tbCódigo.AutoCompleteBracketsList = new char[] {
        '(',
        ')',
        '{',
        '}',
        '[',
        ']',
        '\"',
        '\"',
        '\'',
        '\''};
			this.tbCódigo.AutoIndent = false;
			this.tbCódigo.AutoIndentChars = false;
			this.tbCódigo.AutoIndentCharsPatterns = "\r\n^\\s*[\\w\\.]+(\\s\\w+)?\\s*(?<range>=)\\s*(?<range>[^;]+);\r\n";
			this.tbCódigo.AutoScrollMinSize = new System.Drawing.Size(27, 14);
			this.tbCódigo.BackBrush = null;
			this.tbCódigo.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(208)))), ((int)(((byte)(200)))), ((int)(((byte)(216)))));
			this.tbCódigo.BracketsHighlightStrategy = FastColoredTextBoxNS.BracketsHighlightStrategy.Strategy2;
			this.tbCódigo.CaretVisible = false;
			this.tbCódigo.CharHeight = 14;
			this.tbCódigo.CharWidth = 8;
			this.tbCódigo.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbCódigo.DisabledColor = System.Drawing.Color.FromArgb(((int)(((byte)(100)))), ((int)(((byte)(180)))), ((int)(((byte)(180)))), ((int)(((byte)(180)))));
			this.tbCódigo.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbCódigo.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(22)))), ((int)(((byte)(22)))), ((int)(((byte)(22)))));
			this.tbCódigo.IndentBackColor = System.Drawing.Color.FromArgb(((int)(((byte)(102)))), ((int)(((byte)(99)))), ((int)(((byte)(114)))));
			this.tbCódigo.IsReplaceMode = false;
			this.tbCódigo.Language = FastColoredTextBoxNS.Language.JS;
			this.tbCódigo.LeftBracket = '(';
			this.tbCódigo.LeftBracket2 = '{';
			this.tbCódigo.LineNumberColor = System.Drawing.Color.FromArgb(((int)(((byte)(68)))), ((int)(((byte)(238)))), ((int)(((byte)(153)))));
			this.tbCódigo.Location = new System.Drawing.Point(12, 8);
			this.tbCódigo.Name = "tbCódigo";
			this.tbCódigo.Paddings = new System.Windows.Forms.Padding(0);
			this.tbCódigo.ReadOnly = true;
			this.tbCódigo.RightBracket = ')';
			this.tbCódigo.RightBracket2 = '}';
			this.tbCódigo.SelectionColor = System.Drawing.Color.FromArgb(((int)(((byte)(60)))), ((int)(((byte)(90)))), ((int)(((byte)(95)))), ((int)(((byte)(135)))));
			this.tbCódigo.ServiceColors = ((FastColoredTextBoxNS.ServiceColors)(resources.GetObject("tbCódigo.ServiceColors")));
			this.tbCódigo.ServiceLinesColor = System.Drawing.Color.Transparent;
			this.tbCódigo.Size = new System.Drawing.Size(957, 523);
			this.tbCódigo.TabIndex = 0;
			this.tbCódigo.TabStop = false;
			this.tbCódigo.Zoom = 100;
			// 
			// pnlOpciones
			// 
			this.pnlOpciones.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(12)))), ((int)(((byte)(12)))), ((int)(((byte)(12)))));
			this.pnlOpciones.Controls.Add(this.btnAgregar);
			this.pnlOpciones.Controls.Add(this.btnCancelar);
			this.pnlOpciones.Dock = System.Windows.Forms.DockStyle.Bottom;
			this.pnlOpciones.Location = new System.Drawing.Point(0, 588);
			this.pnlOpciones.Name = "pnlOpciones";
			this.pnlOpciones.Padding = new System.Windows.Forms.Padding(10);
			this.pnlOpciones.Size = new System.Drawing.Size(981, 54);
			this.pnlOpciones.TabIndex = 0;
			// 
			// btnAgregar
			// 
			this.btnAgregar.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(202)))), ((int)(((byte)(41)))), ((int)(((byte)(41)))));
			this.btnAgregar.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnAgregar.BorderRadius = 100F;
			this.btnAgregar.BorderSize = 0F;
			this.btnAgregar.DialogResult = System.Windows.Forms.DialogResult.OK;
			this.btnAgregar.Dock = System.Windows.Forms.DockStyle.Right;
			this.btnAgregar.FlatAppearance.BorderSize = 0;
			this.btnAgregar.FlatAppearance.MouseOverBackColor = System.Drawing.Color.FromArgb(((int)(((byte)(222)))), ((int)(((byte)(61)))), ((int)(((byte)(41)))));
			this.btnAgregar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnAgregar.Font = new System.Drawing.Font("Segoe UI Semibold", 12F);
			this.btnAgregar.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(246)))), ((int)(((byte)(246)))), ((int)(((byte)(246)))));
			this.btnAgregar.Location = new System.Drawing.Point(715, 10);
			this.btnAgregar.Name = "btnAgregar";
			this.btnAgregar.PercentualRadius = true;
			this.btnAgregar.Size = new System.Drawing.Size(128, 34);
			this.btnAgregar.TabIndex = 0;
			this.btnAgregar.Text = "Aceptar";
			this.btnAgregar.UseVisualStyleBackColor = false;
			// 
			// btnCancelar
			// 
			this.btnCancelar.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(30)))), ((int)(((byte)(43)))), ((int)(((byte)(57)))));
			this.btnCancelar.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnCancelar.BorderRadius = 100F;
			this.btnCancelar.BorderSize = 0F;
			this.btnCancelar.DialogResult = System.Windows.Forms.DialogResult.Cancel;
			this.btnCancelar.Dock = System.Windows.Forms.DockStyle.Right;
			this.btnCancelar.FlatAppearance.BorderSize = 0;
			this.btnCancelar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnCancelar.Font = new System.Drawing.Font("Segoe UI Semibold", 11F);
			this.btnCancelar.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.btnCancelar.Location = new System.Drawing.Point(843, 10);
			this.btnCancelar.Name = "btnCancelar";
			this.btnCancelar.PercentualRadius = true;
			this.btnCancelar.Size = new System.Drawing.Size(128, 34);
			this.btnCancelar.TabIndex = 1;
			this.btnCancelar.Text = "Cancelar";
			this.btnCancelar.UseVisualStyleBackColor = false;
			// 
			// FCommandPreview
			// 
			this.AcceptButton = this.btnAgregar;
			this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(32)))), ((int)(((byte)(31)))), ((int)(((byte)(36)))));
			this.CancelButton = this.btnCancelar;
			this.ClientSize = new System.Drawing.Size(981, 642);
			this.Controls.Add(this.pnlContent);
			this.Controls.Add(this.pnlTítulo);
			this.Controls.Add(this.pnlOpciones);
			this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
			this.Name = "FCommandPreview";
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
			this.Text = "FCommandPreview";
			this.Load += new System.EventHandler(this.FCommandPreview_Load);
			this.pnlTítulo.ResumeLayout(false);
			this.pnlTítulo.PerformLayout();
			this.pnlContent.ResumeLayout(false);
			((System.ComponentModel.ISupportInitialize)(this.tbCódigo)).EndInit();
			this.pnlOpciones.ResumeLayout(false);
			this.ResumeLayout(false);

		}

		#endregion

		private System.Windows.Forms.Panel pnlTítulo;
		private System.Windows.Forms.Label lblTítulo;
		private System.Windows.Forms.Label lblFlavor;
		private System.Windows.Forms.Panel pnlContent;
		private FastColoredTextBoxNS.FastColoredTextBox tbCódigo;
		private System.Windows.Forms.Panel pnlOpciones;
		private ControLib.SleekButton btnAgregar;
		private ControLib.SleekButton btnCancelar;
	}
}