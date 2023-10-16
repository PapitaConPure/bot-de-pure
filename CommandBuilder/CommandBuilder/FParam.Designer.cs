
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
			this.pnlPoly = new System.Windows.Forms.Panel();
			this.cmbPoly = new System.Windows.Forms.ComboBox();
			this.label1 = new System.Windows.Forms.Label();
			this.pnlDesc = new System.Windows.Forms.Panel();
			this.tbDesc = new ControLib.SleekTextBox();
			this.lblDescripción = new System.Windows.Forms.Label();
			this.pnlTipo = new System.Windows.Forms.Panel();
			this.cmbTipos = new System.Windows.Forms.ComboBox();
			this.lblTipo = new System.Windows.Forms.Label();
			this.pnlNombre = new System.Windows.Forms.Panel();
			this.tbNombre = new ControLib.SleekTextBox();
			this.lblNombre = new System.Windows.Forms.Label();
			this.pnlOpciones = new System.Windows.Forms.Panel();
			this.btnAgregar = new ControLib.SleekButton();
			this.btnEliminar = new ControLib.SleekButton();
			this.btnCancelar = new ControLib.SleekButton();
			this.pnlPolyMax = new System.Windows.Forms.Panel();
			this.tbPolyMax = new ControLib.SleekTextBox();
			this.label2 = new System.Windows.Forms.Label();
			this.pnlPolyParams = new System.Windows.Forms.Panel();
			this.tbPolyParams = new ControLib.SleekTextBox();
			this.label3 = new System.Windows.Forms.Label();
			this.pnlTítulo.SuspendLayout();
			this.pnlContenido.SuspendLayout();
			this.pnlPoly.SuspendLayout();
			this.pnlDesc.SuspendLayout();
			this.pnlTipo.SuspendLayout();
			this.pnlNombre.SuspendLayout();
			this.pnlOpciones.SuspendLayout();
			this.pnlPolyMax.SuspendLayout();
			this.pnlPolyParams.SuspendLayout();
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
			this.pnlContenido.Controls.Add(this.pnlNombre);
			this.pnlContenido.Dock = System.Windows.Forms.DockStyle.Fill;
			this.pnlContenido.Location = new System.Drawing.Point(0, 45);
			this.pnlContenido.Name = "pnlContenido";
			this.pnlContenido.Padding = new System.Windows.Forms.Padding(12, 8, 12, 8);
			this.pnlContenido.Size = new System.Drawing.Size(534, 376);
			this.pnlContenido.TabIndex = 0;
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
			// pnlNombre
			// 
			this.pnlNombre.Controls.Add(this.tbNombre);
			this.pnlNombre.Controls.Add(this.lblNombre);
			this.pnlNombre.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlNombre.Location = new System.Drawing.Point(12, 8);
			this.pnlNombre.Name = "pnlNombre";
			this.pnlNombre.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlNombre.Size = new System.Drawing.Size(510, 60);
			this.pnlNombre.TabIndex = 0;
			// 
			// tbNombre
			// 
			this.tbNombre.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
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
			this.tbNombre.Location = new System.Drawing.Point(0, 15);
			this.tbNombre.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbNombre.Multiline = false;
			this.tbNombre.Name = "tbNombre";
			this.tbNombre.PasswordChar = '\0';
			this.tbNombre.PercentualRadius = true;
			this.tbNombre.PlaceHolder = "Nombre del parámetro";
			this.tbNombre.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbNombre.ReadOnly = false;
			this.tbNombre.SelectAllOnClick = true;
			this.tbNombre.Size = new System.Drawing.Size(510, 39);
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
			this.lblNombre.Location = new System.Drawing.Point(0, 0);
			this.lblNombre.Name = "lblNombre";
			this.lblNombre.Size = new System.Drawing.Size(60, 15);
			this.lblNombre.TabIndex = 1;
			this.lblNombre.Text = "NOMBRE";
			this.lblNombre.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlOpciones
			// 
			this.pnlOpciones.Controls.Add(this.btnAgregar);
			this.pnlOpciones.Controls.Add(this.btnEliminar);
			this.pnlOpciones.Controls.Add(this.btnCancelar);
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
			this.btnAgregar.Location = new System.Drawing.Point(140, 10);
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
			this.btnEliminar.Location = new System.Drawing.Point(268, 10);
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
			this.btnCancelar.Location = new System.Drawing.Point(396, 10);
			this.btnCancelar.Name = "btnCancelar";
			this.btnCancelar.PercentualRadius = true;
			this.btnCancelar.Size = new System.Drawing.Size(128, 34);
			this.btnCancelar.TabIndex = 2;
			this.btnCancelar.Text = "Cancelar";
			this.btnCancelar.UseVisualStyleBackColor = false;
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
			this.pnlPoly.ResumeLayout(false);
			this.pnlPoly.PerformLayout();
			this.pnlDesc.ResumeLayout(false);
			this.pnlDesc.PerformLayout();
			this.pnlTipo.ResumeLayout(false);
			this.pnlTipo.PerformLayout();
			this.pnlNombre.ResumeLayout(false);
			this.pnlNombre.PerformLayout();
			this.pnlOpciones.ResumeLayout(false);
			this.pnlPolyMax.ResumeLayout(false);
			this.pnlPolyMax.PerformLayout();
			this.pnlPolyParams.ResumeLayout(false);
			this.pnlPolyParams.PerformLayout();
			this.ResumeLayout(false);
			this.PerformLayout();

		}

		#endregion
		private System.Windows.Forms.Panel pnlTítulo;
		private System.Windows.Forms.Label lblTítulo;
		private System.Windows.Forms.Panel pnlContenido;
		private System.Windows.Forms.Panel pnlNombre;
		private System.Windows.Forms.Label lblNombre;
		private System.Windows.Forms.Panel pnlTipo;
		private System.Windows.Forms.Label lblTipo;
		private System.Windows.Forms.Panel pnlDesc;
		private System.Windows.Forms.Label lblDescripción;
		private System.Windows.Forms.Panel pnlOpciones;
		private ControLib.SleekButton btnCancelar;
		private ControLib.SleekButton btnAgregar;
		public ControLib.SleekTextBox tbNombre;
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
	}
}