
namespace CommandBuilder {
	partial class FFlag {
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
			this.pnlContenido = new System.Windows.Forms.Panel();
			this.pnlExpresión = new System.Windows.Forms.Panel();
			this.pnlTipo = new System.Windows.Forms.Panel();
			this.cmbTipos = new System.Windows.Forms.ComboBox();
			this.lblTipo = new System.Windows.Forms.Label();
			this.pnlNombre = new System.Windows.Forms.Panel();
			this.tbNombre = new ControLib.SleekTextBox();
			this.lblNombre = new System.Windows.Forms.Label();
			this.pnlTítuloExpresión = new System.Windows.Forms.Panel();
			this.lblTítuloExpresión = new System.Windows.Forms.Label();
			this.rbSimple = new ControLib.SleekRadioButton();
			this.pnlPadRb2 = new System.Windows.Forms.Panel();
			this.rbExpresiva = new ControLib.SleekRadioButton();
			this.pnlPadRb1 = new System.Windows.Forms.Panel();
			this.panel1 = new System.Windows.Forms.Panel();
			this.pnlDesc = new System.Windows.Forms.Panel();
			this.tbDesc = new ControLib.SleekTextBox();
			this.lblDescripción = new System.Windows.Forms.Label();
			this.pnlLargos = new System.Windows.Forms.Panel();
			this.tbLargos = new ControLib.SleekTextBox();
			this.label3 = new System.Windows.Forms.Label();
			this.pnlCortos = new System.Windows.Forms.Panel();
			this.tbCortos = new ControLib.SleekTextBox();
			this.label2 = new System.Windows.Forms.Label();
			this.pnlTítulo = new System.Windows.Forms.Panel();
			this.lblTítulo = new System.Windows.Forms.Label();
			this.pnlOpciones = new System.Windows.Forms.Panel();
			this.btnAgregar = new ControLib.SleekButton();
			this.btnEliminar = new ControLib.SleekButton();
			this.btnCancelar = new ControLib.SleekButton();
			this.pnlContenido.SuspendLayout();
			this.pnlExpresión.SuspendLayout();
			this.pnlTipo.SuspendLayout();
			this.pnlNombre.SuspendLayout();
			this.pnlTítuloExpresión.SuspendLayout();
			this.pnlDesc.SuspendLayout();
			this.pnlLargos.SuspendLayout();
			this.pnlCortos.SuspendLayout();
			this.pnlTítulo.SuspendLayout();
			this.pnlOpciones.SuspendLayout();
			this.SuspendLayout();
			// 
			// pnlContenido
			// 
			this.pnlContenido.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(20)))), ((int)(((byte)(20)))), ((int)(((byte)(20)))));
			this.pnlContenido.Controls.Add(this.pnlExpresión);
			this.pnlContenido.Controls.Add(this.panel1);
			this.pnlContenido.Controls.Add(this.pnlDesc);
			this.pnlContenido.Controls.Add(this.pnlLargos);
			this.pnlContenido.Controls.Add(this.pnlCortos);
			this.pnlContenido.Dock = System.Windows.Forms.DockStyle.Fill;
			this.pnlContenido.Location = new System.Drawing.Point(0, 45);
			this.pnlContenido.Name = "pnlContenido";
			this.pnlContenido.Padding = new System.Windows.Forms.Padding(12, 8, 12, 8);
			this.pnlContenido.Size = new System.Drawing.Size(532, 367);
			this.pnlContenido.TabIndex = 0;
			// 
			// pnlExpresión
			// 
			this.pnlExpresión.AutoSize = true;
			this.pnlExpresión.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(30)))), ((int)(((byte)(43)))), ((int)(((byte)(57)))));
			this.pnlExpresión.Controls.Add(this.pnlTipo);
			this.pnlExpresión.Controls.Add(this.pnlNombre);
			this.pnlExpresión.Controls.Add(this.pnlTítuloExpresión);
			this.pnlExpresión.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlExpresión.Location = new System.Drawing.Point(12, 196);
			this.pnlExpresión.Name = "pnlExpresión";
			this.pnlExpresión.Size = new System.Drawing.Size(508, 162);
			this.pnlExpresión.TabIndex = 5;
			// 
			// pnlTipo
			// 
			this.pnlTipo.Controls.Add(this.cmbTipos);
			this.pnlTipo.Controls.Add(this.lblTipo);
			this.pnlTipo.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlTipo.Location = new System.Drawing.Point(0, 102);
			this.pnlTipo.Name = "pnlTipo";
			this.pnlTipo.Padding = new System.Windows.Forms.Padding(12, 0, 12, 6);
			this.pnlTipo.Size = new System.Drawing.Size(508, 60);
			this.pnlTipo.TabIndex = 2;
			this.pnlTipo.Visible = false;
			// 
			// cmbTipos
			// 
			this.cmbTipos.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.cmbTipos.Dock = System.Windows.Forms.DockStyle.Fill;
			this.cmbTipos.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
			this.cmbTipos.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.cmbTipos.FormattingEnabled = true;
			this.cmbTipos.Location = new System.Drawing.Point(12, 15);
			this.cmbTipos.Name = "cmbTipos";
			this.cmbTipos.Size = new System.Drawing.Size(484, 28);
			this.cmbTipos.TabIndex = 0;
			// 
			// lblTipo
			// 
			this.lblTipo.AutoSize = true;
			this.lblTipo.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblTipo.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblTipo.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblTipo.Location = new System.Drawing.Point(12, 0);
			this.lblTipo.Name = "lblTipo";
			this.lblTipo.Size = new System.Drawing.Size(36, 15);
			this.lblTipo.TabIndex = 1;
			this.lblTipo.Text = "TIPO";
			this.lblTipo.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlNombre
			// 
			this.pnlNombre.Controls.Add(this.tbNombre);
			this.pnlNombre.Controls.Add(this.lblNombre);
			this.pnlNombre.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlNombre.Location = new System.Drawing.Point(0, 42);
			this.pnlNombre.Name = "pnlNombre";
			this.pnlNombre.Padding = new System.Windows.Forms.Padding(12, 0, 12, 6);
			this.pnlNombre.Size = new System.Drawing.Size(508, 60);
			this.pnlNombre.TabIndex = 1;
			this.pnlNombre.Visible = false;
			// 
			// tbNombre
			// 
			this.tbNombre.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(21)))), ((int)(((byte)(28)))), ((int)(((byte)(34)))));
			this.tbNombre.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbNombre.BorderRadius = 100F;
			this.tbNombre.BorderSize = 0F;
			this.tbNombre.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbNombre.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbNombre.FocusColor = System.Drawing.Color.Empty;
			this.tbNombre.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.tbNombre.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNombre.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNombre.InputText = "";
			this.tbNombre.Location = new System.Drawing.Point(12, 15);
			this.tbNombre.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbNombre.Multiline = false;
			this.tbNombre.Name = "tbNombre";
			this.tbNombre.PasswordChar = '\0';
			this.tbNombre.PercentualRadius = true;
			this.tbNombre.PlaceHolder = "Nombre de Expresión";
			this.tbNombre.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbNombre.ReadOnly = false;
			this.tbNombre.SelectAllOnClick = true;
			this.tbNombre.Size = new System.Drawing.Size(484, 39);
			this.tbNombre.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbNombre.TabIndex = 0;
			this.tbNombre.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbNombre.WordWrap = true;
			// 
			// lblNombre
			// 
			this.lblNombre.AutoSize = true;
			this.lblNombre.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblNombre.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblNombre.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblNombre.Location = new System.Drawing.Point(12, 0);
			this.lblNombre.Name = "lblNombre";
			this.lblNombre.Size = new System.Drawing.Size(60, 15);
			this.lblNombre.TabIndex = 1;
			this.lblNombre.Text = "NOMBRE";
			this.lblNombre.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlTítuloExpresión
			// 
			this.pnlTítuloExpresión.Controls.Add(this.lblTítuloExpresión);
			this.pnlTítuloExpresión.Controls.Add(this.rbSimple);
			this.pnlTítuloExpresión.Controls.Add(this.pnlPadRb2);
			this.pnlTítuloExpresión.Controls.Add(this.rbExpresiva);
			this.pnlTítuloExpresión.Controls.Add(this.pnlPadRb1);
			this.pnlTítuloExpresión.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlTítuloExpresión.Location = new System.Drawing.Point(0, 0);
			this.pnlTítuloExpresión.Name = "pnlTítuloExpresión";
			this.pnlTítuloExpresión.Padding = new System.Windows.Forms.Padding(4, 6, 0, 6);
			this.pnlTítuloExpresión.Size = new System.Drawing.Size(508, 42);
			this.pnlTítuloExpresión.TabIndex = 0;
			// 
			// lblTítuloExpresión
			// 
			this.lblTítuloExpresión.AutoSize = true;
			this.lblTítuloExpresión.Dock = System.Windows.Forms.DockStyle.Left;
			this.lblTítuloExpresión.Font = new System.Drawing.Font("Segoe UI Black", 16F, System.Drawing.FontStyle.Bold);
			this.lblTítuloExpresión.ForeColor = System.Drawing.Color.White;
			this.lblTítuloExpresión.Location = new System.Drawing.Point(4, 6);
			this.lblTítuloExpresión.Name = "lblTítuloExpresión";
			this.lblTítuloExpresión.Size = new System.Drawing.Size(248, 30);
			this.lblTítuloExpresión.TabIndex = 5;
			this.lblTítuloExpresión.Text = "Expresión de Bandera";
			// 
			// rbSimple
			// 
			this.rbSimple.AutoSize = true;
			this.rbSimple.BorderSize = 18F;
			this.rbSimple.BorderWidth = 2.5F;
			this.rbSimple.CheckColor = System.Drawing.Color.FromArgb(((int)(((byte)(232)))), ((int)(((byte)(82)))), ((int)(((byte)(45)))));
			this.rbSimple.Checked = true;
			this.rbSimple.CheckedColor = System.Drawing.Color.FromArgb(((int)(((byte)(86)))), ((int)(((byte)(203)))), ((int)(((byte)(145)))));
			this.rbSimple.CheckSize = 11F;
			this.rbSimple.Dock = System.Windows.Forms.DockStyle.Right;
			this.rbSimple.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.rbSimple.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.rbSimple.Location = new System.Drawing.Point(326, 6);
			this.rbSimple.MinimumSize = new System.Drawing.Size(0, 21);
			this.rbSimple.Name = "rbSimple";
			this.rbSimple.RightToLeft = System.Windows.Forms.RightToLeft.Yes;
			this.rbSimple.Size = new System.Drawing.Size(73, 30);
			this.rbSimple.TabIndex = 0;
			this.rbSimple.TabStop = true;
			this.rbSimple.Text = "Simple";
			this.rbSimple.TextPadding = 2F;
			this.rbSimple.UncheckedColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(196)))), ((int)(((byte)(130)))));
			this.rbSimple.UseVisualStyleBackColor = true;
			// 
			// pnlPadRb2
			// 
			this.pnlPadRb2.Dock = System.Windows.Forms.DockStyle.Right;
			this.pnlPadRb2.Location = new System.Drawing.Point(399, 6);
			this.pnlPadRb2.Name = "pnlPadRb2";
			this.pnlPadRb2.Size = new System.Drawing.Size(10, 30);
			this.pnlPadRb2.TabIndex = 9;
			// 
			// rbExpresiva
			// 
			this.rbExpresiva.AutoSize = true;
			this.rbExpresiva.BorderSize = 18F;
			this.rbExpresiva.BorderWidth = 2.5F;
			this.rbExpresiva.CheckColor = System.Drawing.Color.FromArgb(((int)(((byte)(232)))), ((int)(((byte)(82)))), ((int)(((byte)(45)))));
			this.rbExpresiva.CheckedColor = System.Drawing.Color.FromArgb(((int)(((byte)(86)))), ((int)(((byte)(203)))), ((int)(((byte)(145)))));
			this.rbExpresiva.CheckSize = 11F;
			this.rbExpresiva.Dock = System.Windows.Forms.DockStyle.Right;
			this.rbExpresiva.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.rbExpresiva.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.rbExpresiva.Location = new System.Drawing.Point(409, 6);
			this.rbExpresiva.MinimumSize = new System.Drawing.Size(0, 21);
			this.rbExpresiva.Name = "rbExpresiva";
			this.rbExpresiva.RightToLeft = System.Windows.Forms.RightToLeft.Yes;
			this.rbExpresiva.Size = new System.Drawing.Size(89, 30);
			this.rbExpresiva.TabIndex = 1;
			this.rbExpresiva.Text = "Expresiva";
			this.rbExpresiva.TextPadding = 2F;
			this.rbExpresiva.UncheckedColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(196)))), ((int)(((byte)(130)))));
			this.rbExpresiva.UseVisualStyleBackColor = true;
			this.rbExpresiva.CheckedChanged += new System.EventHandler(this.RbExpresión_CheckedChanged);
			// 
			// pnlPadRb1
			// 
			this.pnlPadRb1.Dock = System.Windows.Forms.DockStyle.Right;
			this.pnlPadRb1.Location = new System.Drawing.Point(498, 6);
			this.pnlPadRb1.Name = "pnlPadRb1";
			this.pnlPadRb1.Size = new System.Drawing.Size(10, 30);
			this.pnlPadRb1.TabIndex = 7;
			// 
			// panel1
			// 
			this.panel1.Dock = System.Windows.Forms.DockStyle.Top;
			this.panel1.Location = new System.Drawing.Point(12, 188);
			this.panel1.Name = "panel1";
			this.panel1.Size = new System.Drawing.Size(508, 8);
			this.panel1.TabIndex = 4;
			// 
			// pnlDesc
			// 
			this.pnlDesc.Controls.Add(this.tbDesc);
			this.pnlDesc.Controls.Add(this.lblDescripción);
			this.pnlDesc.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlDesc.Location = new System.Drawing.Point(12, 128);
			this.pnlDesc.Name = "pnlDesc";
			this.pnlDesc.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlDesc.Size = new System.Drawing.Size(508, 60);
			this.pnlDesc.TabIndex = 2;
			// 
			// tbDesc
			// 
			this.tbDesc.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbDesc.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbDesc.BorderRadius = 100F;
			this.tbDesc.BorderSize = 0F;
			this.tbDesc.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbDesc.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbDesc.FocusColor = System.Drawing.Color.Empty;
			this.tbDesc.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.tbDesc.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbDesc.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbDesc.InputText = "";
			this.tbDesc.Location = new System.Drawing.Point(0, 15);
			this.tbDesc.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbDesc.Multiline = false;
			this.tbDesc.Name = "tbDesc";
			this.tbDesc.PasswordChar = '\0';
			this.tbDesc.PercentualRadius = true;
			this.tbDesc.PlaceHolder = "Descripción";
			this.tbDesc.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbDesc.ReadOnly = false;
			this.tbDesc.SelectAllOnClick = true;
			this.tbDesc.Size = new System.Drawing.Size(508, 39);
			this.tbDesc.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbDesc.TabIndex = 0;
			this.tbDesc.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbDesc.WordWrap = true;
			// 
			// lblDescripción
			// 
			this.lblDescripción.AutoSize = true;
			this.lblDescripción.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblDescripción.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblDescripción.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblDescripción.Location = new System.Drawing.Point(0, 0);
			this.lblDescripción.Name = "lblDescripción";
			this.lblDescripción.Size = new System.Drawing.Size(89, 15);
			this.lblDescripción.TabIndex = 1;
			this.lblDescripción.Text = "DESCRIPCIÓN";
			this.lblDescripción.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlLargos
			// 
			this.pnlLargos.Controls.Add(this.tbLargos);
			this.pnlLargos.Controls.Add(this.label3);
			this.pnlLargos.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlLargos.Location = new System.Drawing.Point(12, 68);
			this.pnlLargos.Name = "pnlLargos";
			this.pnlLargos.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlLargos.Size = new System.Drawing.Size(508, 60);
			this.pnlLargos.TabIndex = 1;
			// 
			// tbLargos
			// 
			this.tbLargos.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbLargos.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbLargos.BorderRadius = 100F;
			this.tbLargos.BorderSize = 0F;
			this.tbLargos.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbLargos.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbLargos.FocusColor = System.Drawing.Color.Empty;
			this.tbLargos.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.tbLargos.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbLargos.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbLargos.InputText = "";
			this.tbLargos.Location = new System.Drawing.Point(0, 15);
			this.tbLargos.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbLargos.Multiline = false;
			this.tbLargos.Name = "tbLargos";
			this.tbLargos.PasswordChar = '\0';
			this.tbLargos.PercentualRadius = true;
			this.tbLargos.PlaceHolder = "Palabras separadas por espacios. Ejemplo: \"nuevo cargar guardar\"";
			this.tbLargos.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbLargos.ReadOnly = false;
			this.tbLargos.SelectAllOnClick = true;
			this.tbLargos.Size = new System.Drawing.Size(508, 39);
			this.tbLargos.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbLargos.TabIndex = 0;
			this.tbLargos.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbLargos.WordWrap = true;
			// 
			// label3
			// 
			this.label3.AutoSize = true;
			this.label3.Dock = System.Windows.Forms.DockStyle.Top;
			this.label3.Font = new System.Drawing.Font("Lato Black", 9F);
			this.label3.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.label3.Location = new System.Drawing.Point(0, 0);
			this.label3.Name = "label3";
			this.label3.Size = new System.Drawing.Size(167, 15);
			this.label3.TabIndex = 1;
			this.label3.Text = "IDENTIFICADORES LARGOS";
			this.label3.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlCortos
			// 
			this.pnlCortos.Controls.Add(this.tbCortos);
			this.pnlCortos.Controls.Add(this.label2);
			this.pnlCortos.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlCortos.Location = new System.Drawing.Point(12, 8);
			this.pnlCortos.Name = "pnlCortos";
			this.pnlCortos.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlCortos.Size = new System.Drawing.Size(508, 60);
			this.pnlCortos.TabIndex = 0;
			// 
			// tbCortos
			// 
			this.tbCortos.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbCortos.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbCortos.BorderRadius = 100F;
			this.tbCortos.BorderSize = 0F;
			this.tbCortos.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbCortos.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbCortos.FocusColor = System.Drawing.Color.Empty;
			this.tbCortos.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.tbCortos.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbCortos.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbCortos.InputText = "";
			this.tbCortos.Location = new System.Drawing.Point(0, 15);
			this.tbCortos.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbCortos.Multiline = false;
			this.tbCortos.Name = "tbCortos";
			this.tbCortos.PasswordChar = '\0';
			this.tbCortos.PercentualRadius = true;
			this.tbCortos.PlaceHolder = "Letras individuales. Ejemplos: \"abc\", \"mnpu\", \"clqmk\", etc.";
			this.tbCortos.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbCortos.ReadOnly = false;
			this.tbCortos.SelectAllOnClick = true;
			this.tbCortos.Size = new System.Drawing.Size(508, 39);
			this.tbCortos.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbCortos.TabIndex = 0;
			this.tbCortos.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbCortos.WordWrap = true;
			// 
			// label2
			// 
			this.label2.AutoSize = true;
			this.label2.Dock = System.Windows.Forms.DockStyle.Top;
			this.label2.Font = new System.Drawing.Font("Lato Black", 9F);
			this.label2.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.label2.Location = new System.Drawing.Point(0, 0);
			this.label2.Name = "label2";
			this.label2.Size = new System.Drawing.Size(168, 15);
			this.label2.TabIndex = 1;
			this.label2.Text = "IDENTIFICADORES CORTOS";
			this.label2.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlTítulo
			// 
			this.pnlTítulo.AutoSize = true;
			this.pnlTítulo.Controls.Add(this.lblTítulo);
			this.pnlTítulo.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlTítulo.Location = new System.Drawing.Point(0, 0);
			this.pnlTítulo.Name = "pnlTítulo";
			this.pnlTítulo.Size = new System.Drawing.Size(532, 45);
			this.pnlTítulo.TabIndex = 2;
			// 
			// lblTítulo
			// 
			this.lblTítulo.AutoSize = true;
			this.lblTítulo.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblTítulo.Font = new System.Drawing.Font("Segoe UI Black", 24F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.lblTítulo.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(231)))), ((int)(((byte)(78)))), ((int)(((byte)(39)))));
			this.lblTítulo.Location = new System.Drawing.Point(0, 0);
			this.lblTítulo.Name = "lblTítulo";
			this.lblTítulo.Size = new System.Drawing.Size(261, 45);
			this.lblTítulo.TabIndex = 5;
			this.lblTítulo.Text = "Nueva Bandera";
			// 
			// pnlOpciones
			// 
			this.pnlOpciones.Controls.Add(this.btnAgregar);
			this.pnlOpciones.Controls.Add(this.btnEliminar);
			this.pnlOpciones.Controls.Add(this.btnCancelar);
			this.pnlOpciones.Dock = System.Windows.Forms.DockStyle.Bottom;
			this.pnlOpciones.Location = new System.Drawing.Point(0, 412);
			this.pnlOpciones.Name = "pnlOpciones";
			this.pnlOpciones.Padding = new System.Windows.Forms.Padding(10);
			this.pnlOpciones.Size = new System.Drawing.Size(532, 54);
			this.pnlOpciones.TabIndex = 1;
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
			this.btnAgregar.Location = new System.Drawing.Point(138, 10);
			this.btnAgregar.Name = "btnAgregar";
			this.btnAgregar.PercentualRadius = true;
			this.btnAgregar.Size = new System.Drawing.Size(128, 34);
			this.btnAgregar.TabIndex = 0;
			this.btnAgregar.Text = "Aceptar";
			this.btnAgregar.UseVisualStyleBackColor = false;
			// 
			// btnEliminar
			// 
			this.btnEliminar.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(30)))), ((int)(((byte)(43)))), ((int)(((byte)(57)))));
			this.btnEliminar.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnEliminar.BorderRadius = 100F;
			this.btnEliminar.BorderSize = 0F;
			this.btnEliminar.DialogResult = System.Windows.Forms.DialogResult.Abort;
			this.btnEliminar.Dock = System.Windows.Forms.DockStyle.Right;
			this.btnEliminar.FlatAppearance.BorderSize = 0;
			this.btnEliminar.FlatAppearance.MouseOverBackColor = System.Drawing.Color.FromArgb(((int)(((byte)(222)))), ((int)(((byte)(61)))), ((int)(((byte)(41)))));
			this.btnEliminar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnEliminar.Font = new System.Drawing.Font("Segoe UI Semibold", 12F);
			this.btnEliminar.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.btnEliminar.Location = new System.Drawing.Point(266, 10);
			this.btnEliminar.Name = "btnEliminar";
			this.btnEliminar.PercentualRadius = true;
			this.btnEliminar.Size = new System.Drawing.Size(128, 34);
			this.btnEliminar.TabIndex = 1;
			this.btnEliminar.Text = "Eliminar";
			this.btnEliminar.UseVisualStyleBackColor = false;
			this.btnEliminar.Visible = false;
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
			this.btnCancelar.Location = new System.Drawing.Point(394, 10);
			this.btnCancelar.Name = "btnCancelar";
			this.btnCancelar.PercentualRadius = true;
			this.btnCancelar.Size = new System.Drawing.Size(128, 34);
			this.btnCancelar.TabIndex = 2;
			this.btnCancelar.Text = "Cancelar";
			this.btnCancelar.UseVisualStyleBackColor = false;
			// 
			// FFlag
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(12)))), ((int)(((byte)(12)))), ((int)(((byte)(12)))));
			this.ClientSize = new System.Drawing.Size(532, 466);
			this.Controls.Add(this.pnlContenido);
			this.Controls.Add(this.pnlTítulo);
			this.Controls.Add(this.pnlOpciones);
			this.Font = new System.Drawing.Font("Segoe UI", 8.25F);
			this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
			this.MinimumSize = new System.Drawing.Size(532, 312);
			this.Name = "FFlag";
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
			this.Text = "FFlag";
			this.Load += new System.EventHandler(this.FParam_Load);
			this.pnlContenido.ResumeLayout(false);
			this.pnlContenido.PerformLayout();
			this.pnlExpresión.ResumeLayout(false);
			this.pnlTipo.ResumeLayout(false);
			this.pnlTipo.PerformLayout();
			this.pnlNombre.ResumeLayout(false);
			this.pnlNombre.PerformLayout();
			this.pnlTítuloExpresión.ResumeLayout(false);
			this.pnlTítuloExpresión.PerformLayout();
			this.pnlDesc.ResumeLayout(false);
			this.pnlDesc.PerformLayout();
			this.pnlLargos.ResumeLayout(false);
			this.pnlLargos.PerformLayout();
			this.pnlCortos.ResumeLayout(false);
			this.pnlCortos.PerformLayout();
			this.pnlTítulo.ResumeLayout(false);
			this.pnlTítulo.PerformLayout();
			this.pnlOpciones.ResumeLayout(false);
			this.ResumeLayout(false);
			this.PerformLayout();

		}

		#endregion

		private System.Windows.Forms.Panel pnlContenido;
		private System.Windows.Forms.Panel pnlTítulo;
		private System.Windows.Forms.Label lblTítulo;
		private System.Windows.Forms.Panel pnlOpciones;
		private ControLib.SleekButton btnAgregar;
		private ControLib.SleekButton btnEliminar;
		private ControLib.SleekButton btnCancelar;
		private System.Windows.Forms.Panel pnlCortos;
		public ControLib.SleekTextBox tbCortos;
		private System.Windows.Forms.Label label2;
		private System.Windows.Forms.Panel pnlLargos;
		public ControLib.SleekTextBox tbLargos;
		private System.Windows.Forms.Label label3;
		private System.Windows.Forms.Panel pnlDesc;
		public ControLib.SleekTextBox tbDesc;
		private System.Windows.Forms.Label lblDescripción;
		private System.Windows.Forms.Panel panel1;
		private System.Windows.Forms.Panel pnlExpresión;
		private System.Windows.Forms.Panel pnlTipo;
		public System.Windows.Forms.ComboBox cmbTipos;
		private System.Windows.Forms.Label lblTipo;
		private System.Windows.Forms.Panel pnlNombre;
		public ControLib.SleekTextBox tbNombre;
		private System.Windows.Forms.Label lblNombre;
		private System.Windows.Forms.Panel pnlTítuloExpresión;
		private System.Windows.Forms.Label lblTítuloExpresión;
		private System.Windows.Forms.Panel pnlPadRb2;
		private System.Windows.Forms.Panel pnlPadRb1;
		public ControLib.SleekRadioButton rbSimple;
		public ControLib.SleekRadioButton rbExpresiva;
	}
}