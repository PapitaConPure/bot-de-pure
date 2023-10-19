
namespace CommandBuilder {
	partial class FParam {
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
			this.pnlTítulo = new System.Windows.Forms.Panel();
			this.lblTítulo = new System.Windows.Forms.Label();
			this.pnlContenido = new System.Windows.Forms.Panel();
			this.pnlPolyParams = new System.Windows.Forms.Panel();
			this.tbPolyParams = new ControLib.SleekTextBox();
			this.label3 = new System.Windows.Forms.Label();
			this.pnlPolyMax = new System.Windows.Forms.Panel();
			this.tbPolyMax = new ControLib.SleekTextBox();
			this.label2 = new System.Windows.Forms.Label();
			this.pnlPoly = new System.Windows.Forms.Panel();
			this.cmbPoly = new System.Windows.Forms.ComboBox();
			this.label1 = new System.Windows.Forms.Label();
			this.pnlDesc = new System.Windows.Forms.Panel();
			this.tbDesc = new ControLib.SleekTextBox();
			this.lblDescripción = new System.Windows.Forms.Label();
			this.pnlTipo = new System.Windows.Forms.Panel();
			this.cmbTipos = new System.Windows.Forms.ComboBox();
			this.lblTipo = new System.Windows.Forms.Label();
			this.pnlOpcionesBase = new System.Windows.Forms.Panel();
			this.tlpOpcionesBase = new System.Windows.Forms.TableLayoutPanel();
			this.pnlOptional = new System.Windows.Forms.Panel();
			this.cbOptional = new System.Windows.Forms.CheckBox();
			this.lblOptional = new System.Windows.Forms.Label();
			this.pnlName = new System.Windows.Forms.Panel();
			this.tbName = new ControLib.SleekTextBox();
			this.lblNombre = new System.Windows.Forms.Label();
			this.pnlOpciones = new System.Windows.Forms.Panel();
			this.btnAgregar = new ControLib.SleekButton();
			this.btnEliminar = new ControLib.SleekButton();
			this.btnCancelar = new ControLib.SleekButton();
			this.pnlTítulo.SuspendLayout();
			this.pnlContenido.SuspendLayout();
			this.pnlPolyParams.SuspendLayout();
			this.pnlPolyMax.SuspendLayout();
			this.pnlPoly.SuspendLayout();
			this.pnlDesc.SuspendLayout();
			this.pnlTipo.SuspendLayout();
			this.pnlOpcionesBase.SuspendLayout();
			this.tlpOpcionesBase.SuspendLayout();
			this.pnlOptional.SuspendLayout();
			this.pnlName.SuspendLayout();
			this.pnlOpciones.SuspendLayout();
			this.SuspendLayout();
			// 
			// pnlTítulo
			// 
			this.pnlTítulo.AutoSize = true;
			this.pnlTítulo.Controls.Add(this.lblTítulo);
			this.pnlTítulo.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlTítulo.Location = new System.Drawing.Point(0, 0);
			this.pnlTítulo.Name = "pnlTítulo";
			this.pnlTítulo.Size = new System.Drawing.Size(534, 45);
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
			this.lblTítulo.Size = new System.Drawing.Size(298, 45);
			this.lblTítulo.TabIndex = 5;
			this.lblTítulo.Text = "Nuevo Parámetro";
			// 
			// pnlContenido
			// 
			this.pnlContenido.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(20)))), ((int)(((byte)(20)))), ((int)(((byte)(20)))));
			this.pnlContenido.Controls.Add(this.pnlPolyParams);
			this.pnlContenido.Controls.Add(this.pnlPolyMax);
			this.pnlContenido.Controls.Add(this.pnlPoly);
			this.pnlContenido.Controls.Add(this.pnlDesc);
			this.pnlContenido.Controls.Add(this.pnlTipo);
			this.pnlContenido.Controls.Add(this.pnlOpcionesBase);
			this.pnlContenido.Dock = System.Windows.Forms.DockStyle.Fill;
			this.pnlContenido.Location = new System.Drawing.Point(0, 45);
			this.pnlContenido.Name = "pnlContenido";
			this.pnlContenido.Padding = new System.Windows.Forms.Padding(12, 8, 12, 8);
			this.pnlContenido.Size = new System.Drawing.Size(534, 376);
			this.pnlContenido.TabIndex = 0;
			// 
			// pnlPolyParams
			// 
			this.pnlPolyParams.Controls.Add(this.tbPolyParams);
			this.pnlPolyParams.Controls.Add(this.label3);
			this.pnlPolyParams.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlPolyParams.Location = new System.Drawing.Point(12, 308);
			this.pnlPolyParams.Name = "pnlPolyParams";
			this.pnlPolyParams.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlPolyParams.Size = new System.Drawing.Size(510, 60);
			this.pnlPolyParams.TabIndex = 5;
			this.pnlPolyParams.Visible = false;
			// 
			// tbPolyParams
			// 
			this.tbPolyParams.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbPolyParams.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbPolyParams.BorderRadius = 100F;
			this.tbPolyParams.BorderSize = 0F;
			this.tbPolyParams.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbPolyParams.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbPolyParams.FocusColor = System.Drawing.Color.Empty;
			this.tbPolyParams.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.tbPolyParams.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbPolyParams.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbPolyParams.InputText = "";
			this.tbPolyParams.Location = new System.Drawing.Point(0, 15);
			this.tbPolyParams.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbPolyParams.Multiline = false;
			this.tbPolyParams.Name = "tbPolyParams";
			this.tbPolyParams.PasswordChar = '\0';
			this.tbPolyParams.PercentualRadius = true;
			this.tbPolyParams.PlaceHolder = "Nombres de poliparámetro, separados por espacios";
			this.tbPolyParams.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbPolyParams.ReadOnly = false;
			this.tbPolyParams.SelectAllOnClick = true;
			this.tbPolyParams.Size = new System.Drawing.Size(510, 39);
			this.tbPolyParams.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbPolyParams.TabIndex = 2;
			this.tbPolyParams.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbPolyParams.WordWrap = true;
			// 
			// label3
			// 
			this.label3.AutoSize = true;
			this.label3.Dock = System.Windows.Forms.DockStyle.Top;
			this.label3.Font = new System.Drawing.Font("Lato Black", 9F);
			this.label3.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.label3.Location = new System.Drawing.Point(0, 0);
			this.label3.Name = "label3";
			this.label3.Size = new System.Drawing.Size(118, 15);
			this.label3.TabIndex = 3;
			this.label3.Text = "POLIPARÁMETROS";
			this.label3.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlPolyMax
			// 
			this.pnlPolyMax.Controls.Add(this.tbPolyMax);
			this.pnlPolyMax.Controls.Add(this.label2);
			this.pnlPolyMax.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlPolyMax.Location = new System.Drawing.Point(12, 248);
			this.pnlPolyMax.Name = "pnlPolyMax";
			this.pnlPolyMax.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlPolyMax.Size = new System.Drawing.Size(510, 60);
			this.pnlPolyMax.TabIndex = 4;
			// 
			// tbPolyMax
			// 
			this.tbPolyMax.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbPolyMax.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbPolyMax.BorderRadius = 100F;
			this.tbPolyMax.BorderSize = 0F;
			this.tbPolyMax.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbPolyMax.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbPolyMax.FocusColor = System.Drawing.Color.Empty;
			this.tbPolyMax.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.tbPolyMax.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbPolyMax.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbPolyMax.InputText = "";
			this.tbPolyMax.Location = new System.Drawing.Point(0, 15);
			this.tbPolyMax.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbPolyMax.Multiline = false;
			this.tbPolyMax.Name = "tbPolyMax";
			this.tbPolyMax.PasswordChar = '\0';
			this.tbPolyMax.PercentualRadius = true;
			this.tbPolyMax.PlaceHolder = "Cantidad máxima de poliparámetros. Número entero";
			this.tbPolyMax.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbPolyMax.ReadOnly = false;
			this.tbPolyMax.SelectAllOnClick = true;
			this.tbPolyMax.Size = new System.Drawing.Size(510, 39);
			this.tbPolyMax.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbPolyMax.TabIndex = 2;
			this.tbPolyMax.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbPolyMax.WordWrap = true;
			// 
			// label2
			// 
			this.label2.AutoSize = true;
			this.label2.Dock = System.Windows.Forms.DockStyle.Top;
			this.label2.Font = new System.Drawing.Font("Lato Black", 9F);
			this.label2.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.label2.Location = new System.Drawing.Point(0, 0);
			this.label2.Name = "label2";
			this.label2.Size = new System.Drawing.Size(179, 15);
			this.label2.TabIndex = 3;
			this.label2.Text = "MÁXIMO POLIPARAMÉTRICO";
			this.label2.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlPoly
			// 
			this.pnlPoly.Controls.Add(this.cmbPoly);
			this.pnlPoly.Controls.Add(this.label1);
			this.pnlPoly.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlPoly.Location = new System.Drawing.Point(12, 188);
			this.pnlPoly.Name = "pnlPoly";
			this.pnlPoly.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlPoly.Size = new System.Drawing.Size(510, 60);
			this.pnlPoly.TabIndex = 3;
			// 
			// cmbPoly
			// 
			this.cmbPoly.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.cmbPoly.Dock = System.Windows.Forms.DockStyle.Fill;
			this.cmbPoly.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
			this.cmbPoly.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.cmbPoly.FormattingEnabled = true;
			this.cmbPoly.Location = new System.Drawing.Point(0, 15);
			this.cmbPoly.Name = "cmbPoly";
			this.cmbPoly.Size = new System.Drawing.Size(510, 28);
			this.cmbPoly.TabIndex = 2;
			this.cmbPoly.SelectedIndexChanged += new System.EventHandler(this.CmbPoly_SelectedIndexChanged);
			// 
			// label1
			// 
			this.label1.AutoSize = true;
			this.label1.Dock = System.Windows.Forms.DockStyle.Top;
			this.label1.Font = new System.Drawing.Font("Lato Black", 9F);
			this.label1.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.label1.Location = new System.Drawing.Point(0, 0);
			this.label1.Name = "label1";
			this.label1.Size = new System.Drawing.Size(217, 15);
			this.label1.TabIndex = 1;
			this.label1.Text = "GRADO DE POLIPARAMETRIZACIÓN";
			this.label1.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlDesc
			// 
			this.pnlDesc.Controls.Add(this.tbDesc);
			this.pnlDesc.Controls.Add(this.lblDescripción);
			this.pnlDesc.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlDesc.Location = new System.Drawing.Point(12, 128);
			this.pnlDesc.Name = "pnlDesc";
			this.pnlDesc.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlDesc.Size = new System.Drawing.Size(510, 60);
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
			this.tbDesc.PlaceHolder = "Descripción de funcionalidad del parámetro";
			this.tbDesc.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbDesc.ReadOnly = false;
			this.tbDesc.SelectAllOnClick = true;
			this.tbDesc.Size = new System.Drawing.Size(510, 39);
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
			// pnlTipo
			// 
			this.pnlTipo.Controls.Add(this.cmbTipos);
			this.pnlTipo.Controls.Add(this.lblTipo);
			this.pnlTipo.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlTipo.Location = new System.Drawing.Point(12, 68);
			this.pnlTipo.Name = "pnlTipo";
			this.pnlTipo.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlTipo.Size = new System.Drawing.Size(510, 60);
			this.pnlTipo.TabIndex = 1;
			// 
			// cmbTipos
			// 
			this.cmbTipos.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.cmbTipos.Dock = System.Windows.Forms.DockStyle.Fill;
			this.cmbTipos.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
			this.cmbTipos.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.cmbTipos.FormattingEnabled = true;
			this.cmbTipos.Location = new System.Drawing.Point(0, 15);
			this.cmbTipos.Name = "cmbTipos";
			this.cmbTipos.Size = new System.Drawing.Size(510, 28);
			this.cmbTipos.TabIndex = 0;
			// 
			// lblTipo
			// 
			this.lblTipo.AutoSize = true;
			this.lblTipo.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblTipo.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblTipo.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblTipo.Location = new System.Drawing.Point(0, 0);
			this.lblTipo.Name = "lblTipo";
			this.lblTipo.Size = new System.Drawing.Size(36, 15);
			this.lblTipo.TabIndex = 1;
			this.lblTipo.Text = "TIPO";
			this.lblTipo.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlOpcionesBase
			// 
			this.pnlOpcionesBase.Controls.Add(this.tlpOpcionesBase);
			this.pnlOpcionesBase.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlOpcionesBase.Location = new System.Drawing.Point(12, 8);
			this.pnlOpcionesBase.Name = "pnlOpcionesBase";
			this.pnlOpcionesBase.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlOpcionesBase.Size = new System.Drawing.Size(510, 60);
			this.pnlOpcionesBase.TabIndex = 0;
			// 
			// tlpOpcionesBase
			// 
			this.tlpOpcionesBase.ColumnCount = 2;
			this.tlpOpcionesBase.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 75.68627F));
			this.tlpOpcionesBase.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 24.31373F));
			this.tlpOpcionesBase.Controls.Add(this.pnlOptional, 1, 0);
			this.tlpOpcionesBase.Controls.Add(this.pnlName, 0, 0);
			this.tlpOpcionesBase.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tlpOpcionesBase.Location = new System.Drawing.Point(0, 0);
			this.tlpOpcionesBase.Name = "tlpOpcionesBase";
			this.tlpOpcionesBase.RowCount = 1;
			this.tlpOpcionesBase.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 50F));
			this.tlpOpcionesBase.Size = new System.Drawing.Size(510, 54);
			this.tlpOpcionesBase.TabIndex = 0;
			// 
			// pnlOptional
			// 
			this.pnlOptional.Controls.Add(this.cbOptional);
			this.pnlOptional.Controls.Add(this.lblOptional);
			this.pnlOptional.Dock = System.Windows.Forms.DockStyle.Fill;
			this.pnlOptional.Location = new System.Drawing.Point(388, 0);
			this.pnlOptional.Margin = new System.Windows.Forms.Padding(3, 0, 0, 0);
			this.pnlOptional.Name = "pnlOptional";
			this.pnlOptional.Size = new System.Drawing.Size(122, 54);
			this.pnlOptional.TabIndex = 1;
			// 
			// cbOptional
			// 
			this.cbOptional.AutoSize = true;
			this.cbOptional.Dock = System.Windows.Forms.DockStyle.Fill;
			this.cbOptional.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.cbOptional.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(246)))), ((int)(((byte)(246)))), ((int)(((byte)(246)))));
			this.cbOptional.Location = new System.Drawing.Point(0, 15);
			this.cbOptional.Name = "cbOptional";
			this.cbOptional.Size = new System.Drawing.Size(122, 39);
			this.cbOptional.TabIndex = 4;
			this.cbOptional.Text = "Es opcional\r\n";
			this.cbOptional.UseVisualStyleBackColor = true;
			// 
			// lblOptional
			// 
			this.lblOptional.AutoSize = true;
			this.lblOptional.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblOptional.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblOptional.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblOptional.Location = new System.Drawing.Point(0, 0);
			this.lblOptional.Name = "lblOptional";
			this.lblOptional.Size = new System.Drawing.Size(71, 15);
			this.lblOptional.TabIndex = 3;
			this.lblOptional.Text = "OPCIONAL";
			this.lblOptional.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlName
			// 
			this.pnlName.Controls.Add(this.tbName);
			this.pnlName.Controls.Add(this.lblNombre);
			this.pnlName.Dock = System.Windows.Forms.DockStyle.Fill;
			this.pnlName.Location = new System.Drawing.Point(0, 0);
			this.pnlName.Margin = new System.Windows.Forms.Padding(0, 0, 3, 0);
			this.pnlName.Name = "pnlName";
			this.pnlName.Size = new System.Drawing.Size(382, 54);
			this.pnlName.TabIndex = 0;
			// 
			// tbName
			// 
			this.tbName.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbName.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbName.BorderRadius = 100F;
			this.tbName.BorderSize = 0F;
			this.tbName.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbName.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbName.FocusColor = System.Drawing.Color.Empty;
			this.tbName.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.tbName.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbName.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbName.InputText = "";
			this.tbName.Location = new System.Drawing.Point(0, 15);
			this.tbName.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbName.Multiline = false;
			this.tbName.Name = "tbName";
			this.tbName.PasswordChar = '\0';
			this.tbName.PercentualRadius = true;
			this.tbName.PlaceHolder = "Nombre del parámetro";
			this.tbName.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbName.ReadOnly = false;
			this.tbName.SelectAllOnClick = true;
			this.tbName.Size = new System.Drawing.Size(382, 39);
			this.tbName.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbName.TabIndex = 2;
			this.tbName.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbName.WordWrap = true;
			// 
			// lblNombre
			// 
			this.lblNombre.AutoSize = true;
			this.lblNombre.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblNombre.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblNombre.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblNombre.Location = new System.Drawing.Point(0, 0);
			this.lblNombre.Name = "lblNombre";
			this.lblNombre.Size = new System.Drawing.Size(60, 15);
			this.lblNombre.TabIndex = 3;
			this.lblNombre.Text = "NOMBRE";
			this.lblNombre.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlOpciones
			// 
			this.pnlOpciones.Controls.Add(this.btnEliminar);
			this.pnlOpciones.Controls.Add(this.btnCancelar);
			this.pnlOpciones.Controls.Add(this.btnAgregar);
			this.pnlOpciones.Dock = System.Windows.Forms.DockStyle.Bottom;
			this.pnlOpciones.Location = new System.Drawing.Point(0, 421);
			this.pnlOpciones.Name = "pnlOpciones";
			this.pnlOpciones.Padding = new System.Windows.Forms.Padding(10);
			this.pnlOpciones.Size = new System.Drawing.Size(534, 54);
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
			this.btnAgregar.Location = new System.Drawing.Point(396, 10);
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
			this.btnEliminar.Location = new System.Drawing.Point(140, 10);
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
			this.btnCancelar.Location = new System.Drawing.Point(268, 10);
			this.btnCancelar.Name = "btnCancelar";
			this.btnCancelar.PercentualRadius = true;
			this.btnCancelar.Size = new System.Drawing.Size(128, 34);
			this.btnCancelar.TabIndex = 2;
			this.btnCancelar.Text = "Cancelar";
			this.btnCancelar.UseVisualStyleBackColor = false;
			// 
			// FParam
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(12)))), ((int)(((byte)(12)))), ((int)(((byte)(12)))));
			this.ClientSize = new System.Drawing.Size(534, 475);
			this.Controls.Add(this.pnlContenido);
			this.Controls.Add(this.pnlTítulo);
			this.Controls.Add(this.pnlOpciones);
			this.Font = new System.Drawing.Font("Segoe UI", 8.25F);
			this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
			this.MinimumSize = new System.Drawing.Size(400, 296);
			this.Name = "FParam";
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
			this.Text = "FParam";
			this.pnlTítulo.ResumeLayout(false);
			this.pnlTítulo.PerformLayout();
			this.pnlContenido.ResumeLayout(false);
			this.pnlPolyParams.ResumeLayout(false);
			this.pnlPolyParams.PerformLayout();
			this.pnlPolyMax.ResumeLayout(false);
			this.pnlPolyMax.PerformLayout();
			this.pnlPoly.ResumeLayout(false);
			this.pnlPoly.PerformLayout();
			this.pnlDesc.ResumeLayout(false);
			this.pnlDesc.PerformLayout();
			this.pnlTipo.ResumeLayout(false);
			this.pnlTipo.PerformLayout();
			this.pnlOpcionesBase.ResumeLayout(false);
			this.tlpOpcionesBase.ResumeLayout(false);
			this.pnlOptional.ResumeLayout(false);
			this.pnlOptional.PerformLayout();
			this.pnlName.ResumeLayout(false);
			this.pnlName.PerformLayout();
			this.pnlOpciones.ResumeLayout(false);
			this.ResumeLayout(false);
			this.PerformLayout();

		}

		#endregion
		private System.Windows.Forms.Panel pnlTítulo;
		private System.Windows.Forms.Label lblTítulo;
		private System.Windows.Forms.Panel pnlContenido;
		private System.Windows.Forms.Panel pnlOpcionesBase;
		private System.Windows.Forms.Panel pnlTipo;
		private System.Windows.Forms.Label lblTipo;
		private System.Windows.Forms.Panel pnlDesc;
		private System.Windows.Forms.Label lblDescripción;
		private System.Windows.Forms.Panel pnlOpciones;
		private ControLib.SleekButton btnCancelar;
		private ControLib.SleekButton btnAgregar;
		public System.Windows.Forms.ComboBox cmbTipos;
		public ControLib.SleekTextBox tbDesc;
		private ControLib.SleekButton btnEliminar;
		private System.Windows.Forms.Panel pnlPoly;
		private System.Windows.Forms.Label label1;
		public System.Windows.Forms.ComboBox cmbPoly;
		private System.Windows.Forms.Panel pnlPolyParams;
		public ControLib.SleekTextBox tbPolyParams;
		private System.Windows.Forms.Label label3;
		private System.Windows.Forms.Panel pnlPolyMax;
		public ControLib.SleekTextBox tbPolyMax;
		private System.Windows.Forms.Label label2;
		private System.Windows.Forms.TableLayoutPanel tlpOpcionesBase;
		private System.Windows.Forms.Panel pnlName;
		public ControLib.SleekTextBox tbName;
		private System.Windows.Forms.Label lblNombre;
		private System.Windows.Forms.Panel pnlOptional;
		private System.Windows.Forms.Label lblOptional;
		private System.Windows.Forms.CheckBox cbOptional;
	}
}